import logging
from typing import Dict, List, Any
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import torch
from transformers import (
    AutoTokenizer,
    AutoModel,
    pipeline
)
import re
from collections import Counter

logger = logging.getLogger(__name__)


class QuestionEvaluator:
    def __init__(self):
        self.is_initialized = False
        self.tokenizer = None
        self.model = None
        self.embedder = None
        
    async def initialize(self):
        """Initialize models"""
        try:
            # Use multilingual BERT for Korean support
            model_name = "klue/bert-base"
            
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModel.from_pretrained(model_name)
            self.embedder = pipeline(
                'feature-extraction',
                model=model_name,
                tokenizer=self.tokenizer
            )
            
            self.is_initialized = True
            logger.info("Models initialized successfully")
        except Exception as e:
            logger.error(f"Model initialization failed: {str(e)}")
            # Fallback to rule-based evaluation
            self.is_initialized = False
    
    async def evaluate_question(self, question_data: Dict[str, Any]) -> Dict[str, float]:
        """Evaluate question across multiple dimensions"""
        scores = {
            "contextCompleteness": await self._evaluate_context_completeness(question_data),
            "questionQuality": await self._evaluate_question_quality(question_data),
            "rippleEffect": await self._evaluate_ripple_effect(question_data),
            "originality": await self._evaluate_originality(question_data),
            "interactivity": await self._evaluate_interactivity(question_data)
        }
        
        return scores
    
    async def _evaluate_context_completeness(self, data: Dict[str, Any]) -> float:
        """Evaluate how complete the context information is"""
        context_fields = [
            data.get("background", ""),
            data.get("priorKnowledge", ""),
            data.get("attemptedApproach", ""),
            data.get("expectedUse", "")
        ]
        
        # Check field completeness
        field_scores = []
        for field in context_fields:
            if not field:
                field_scores.append(0.0)
            else:
                # Score based on length and detail
                word_count = len(field.split())
                score = min(word_count / 50.0, 1.0)  # Normalize to 50 words
                field_scores.append(score)
        
        # Check coherence between fields (simplified)
        if all(field for field in context_fields):
            coherence_bonus = 0.2
        else:
            coherence_bonus = 0.0
        
        base_score = np.mean(field_scores)
        return min(base_score + coherence_bonus, 1.0)
    
    async def _evaluate_question_quality(self, data: Dict[str, Any]) -> float:
        """Evaluate the quality of the core question"""
        question = data.get("coreQuestion", "")
        
        if not question:
            return 0.0
        
        # Check question characteristics
        scores = []
        
        # Length check (not too short, not too long)
        word_count = len(question.split())
        if 10 <= word_count <= 50:
            scores.append(1.0)
        elif 5 <= word_count < 10 or 50 < word_count <= 100:
            scores.append(0.7)
        else:
            scores.append(0.4)
        
        # Specificity check (contains specific terms)
        specific_terms = len(re.findall(r'\b[A-Z][a-z]+\b|[0-9]+|[a-zA-Z]+\.[a-z]+', question))
        specificity_score = min(specific_terms / 3.0, 1.0)
        scores.append(specificity_score)
        
        # Question mark check
        if question.strip().endswith('?'):
            scores.append(1.0)
        else:
            scores.append(0.5)
        
        # Check if it's not a yes/no question
        yes_no_patterns = r'^(is|are|do|does|did|can|could|will|would|should)'
        if not re.match(yes_no_patterns, question.lower()):
            scores.append(1.0)
        else:
            scores.append(0.6)
        
        return np.mean(scores)
    
    async def _evaluate_ripple_effect(self, data: Dict[str, Any]) -> float:
        """Evaluate potential impact and follow-up questions"""
        question = data.get("coreQuestion", "")
        tags = data.get("tags", [])
        
        # Check breadth of topic (based on tags)
        tag_score = min(len(tags) / 3.0, 1.0) if tags else 0.5
        
        # Check if question addresses fundamental concepts
        fundamental_keywords = [
            'how', 'why', 'architecture', 'design', 'pattern',
            'principle', 'concept', 'approach', 'strategy', 'best'
        ]
        
        keyword_count = sum(1 for keyword in fundamental_keywords if keyword in question.lower())
        keyword_score = min(keyword_count / 2.0, 1.0)
        
        # Check expected use for broader application
        expected_use = data.get("expectedUse", "").lower()
        if any(word in expected_use for word in ['team', 'project', 'multiple', 'future', 'share']):
            application_score = 0.9
        else:
            application_score = 0.6
        
        return np.mean([tag_score, keyword_score, application_score])
    
    async def _evaluate_originality(self, data: Dict[str, Any]) -> float:
        """Evaluate how unique or original the question is"""
        question = data.get("coreQuestion", "")
        attempted = data.get("attemptedApproach", "")
        
        # Check for unique combination of concepts
        words = question.lower().split()
        unique_bigrams = len(set(zip(words[:-1], words[1:])))
        bigram_score = min(unique_bigrams / 5.0, 1.0)
        
        # Check if attempted approach shows exploration
        if attempted and len(attempted.split()) > 20:
            exploration_score = 0.8
        else:
            exploration_score = 0.5
        
        # Penalty for very common question patterns
        common_patterns = [
            r'what is the difference between',
            r'how to implement',
            r'what is the best way to'
        ]
        
        penalty = 0.2 if any(re.search(pattern, question.lower()) for pattern in common_patterns) else 0.0
        
        return max(np.mean([bigram_score, exploration_score]) - penalty, 0.0)
    
    async def _evaluate_interactivity(self, data: Dict[str, Any]) -> float:
        """Evaluate potential for discussion and collaboration"""
        question = data.get("coreQuestion", "")
        context = " ".join([
            data.get("background", ""),
            data.get("priorKnowledge", "")
        ])
        
        # Check for discussion-prompting elements
        discussion_keywords = [
            'trade-off', 'pros and cons', 'alternatives', 'compare',
            'opinion', 'experience', 'approach', 'consideration'
        ]
        
        keyword_count = sum(1 for keyword in discussion_keywords if keyword in question.lower() or keyword in context.lower())
        keyword_score = min(keyword_count / 2.0, 1.0)
        
        # Check if question invites multiple perspectives
        if '?' in question and any(word in question.lower() for word in ['or', 'vs', 'versus', 'compared']):
            perspective_score = 0.9
        else:
            perspective_score = 0.6
        
        return np.mean([keyword_score, perspective_score])
    
    def calculate_total_score(self, scores: Dict[str, float]) -> float:
        """Calculate weighted total score"""
        weights = {
            "contextCompleteness": 0.25,
            "questionQuality": 0.30,
            "rippleEffect": 0.20,
            "originality": 0.15,
            "interactivity": 0.10
        }
        
        total = sum(scores[key] * weights[key] for key in weights)
        return round(total * 10, 2)  # Scale to 0-10
    
    async def get_embedding(self, text: str) -> List[float]:
        """Get text embedding for similarity search"""
        if not self.is_initialized:
            # Fallback: simple character-based hash
            return [float(ord(c)) for c in text[:100]]
        
        try:
            embeddings = self.embedder(text)
            # Average pooling
            embedding = np.mean(embeddings[0], axis=0)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Embedding generation failed: {str(e)}")
            return []
    
    async def extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text"""
        # Simple keyword extraction
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        
        # Remove common words
        stop_words = {
            'the', 'is', 'at', 'which', 'on', 'and', 'for',
            'this', 'that', 'with', 'from', 'have', 'has'
        }
        
        words = [w for w in words if w not in stop_words]
        
        # Count frequency
        word_freq = Counter(words)
        
        # Return top keywords
        return [word for word, _ in word_freq.most_common(10)]