import asyncpg
import os
from typing import Optional, Dict, Any, List
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)


class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.database_url = os.getenv("DATABASE_URL")
    
    async def connect(self):
        """Create database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=5,
                max_size=20
            )
            logger.info("Database connected")
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            raise
    
    async def disconnect(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database disconnected")
    
    async def get_question_with_context(self, question_id: str) -> Optional[Dict[str, Any]]:
        """Fetch question with context and tags"""
        query = """
            SELECT 
                q.id,
                q.core_question,
                c.background,
                c.prior_knowledge,
                c.attempted_approach,
                c.expected_use,
                COALESCE(
                    array_agg(t.name) FILTER (WHERE t.name IS NOT NULL),
                    '{}'::text[]
                ) as tags
            FROM questions q
            LEFT JOIN contexts c ON q.id = c.question_id
            LEFT JOIN question_tags qt ON q.id = qt.question_id
            LEFT JOIN tags t ON qt.tag_id = t.id
            WHERE q.id = $1
            GROUP BY q.id, q.core_question, c.background, 
                     c.prior_knowledge, c.attempted_approach, c.expected_use
        """
        
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, question_id)
            
            if not row:
                return None
            
            return {
                "id": row["id"],
                "coreQuestion": row["core_question"],
                "background": row["background"] or "",
                "priorKnowledge": row["prior_knowledge"] or "",
                "attemptedApproach": row["attempted_approach"] or "",
                "expectedUse": row["expected_use"] or "",
                "tags": row["tags"]
            }
    
    async def save_evaluation(
        self,
        question_id: str,
        scores: Dict[str, float],
        total_score: float
    ):
        """Save evaluation results to database"""
        query = """
            INSERT INTO evaluations (
                question_id,
                context_completeness,
                question_quality,
                ripple_effect,
                originality,
                interactivity,
                total_score,
                metadata,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        """
        
        metadata = {
            "evaluated_at": datetime.utcnow().isoformat(),
            "model_version": "1.0.0"
        }
        
        async with self.pool.acquire() as conn:
            await conn.execute(
                query,
                question_id,
                scores["contextCompleteness"],
                scores["questionQuality"],
                scores["rippleEffect"],
                scores["originality"],
                scores["interactivity"],
                total_score,
                json.dumps(metadata),
                datetime.utcnow()
            )
            
            # Update question value score
            await conn.execute(
                "UPDATE questions SET value_score = $1 WHERE id = $2",
                total_score,
                question_id
            )
    
    async def find_similar_questions(
        self,
        embedding: List[float],
        limit: int = 10,
        min_score: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Find similar questions using vector similarity"""
        # Note: This is a simplified version. In production, you'd use
        # a vector database like pgvector or a dedicated service
        
        query = """
            SELECT 
                q.id,
                q.core_question,
                q.value_score,
                array_agg(t.name) as tags
            FROM questions q
            LEFT JOIN question_tags qt ON q.id = qt.question_id
            LEFT JOIN tags t ON qt.tag_id = t.id
            WHERE q.status = 'PUBLISHED'
            GROUP BY q.id, q.core_question, q.value_score
            ORDER BY q.value_score DESC
            LIMIT $1
        """
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, limit)
            
            return [
                {
                    "id": row["id"],
                    "coreQuestion": row["core_question"],
                    "valueScore": float(row["value_score"]),
                    "tags": row["tags"] or []
                }
                for row in rows
            ]