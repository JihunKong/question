from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import asyncpg
import numpy as np
from dotenv import load_dotenv
import logging
from datetime import datetime

from src.evaluator import QuestionEvaluator
from src.database import Database
from src.models import EvaluationRequest, EvaluationResult, SimilarityRequest

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Question AI Processor", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3001").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
db = Database()
evaluator = QuestionEvaluator()


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    await db.connect()
    await evaluator.initialize()
    logger.info("AI Processor service started")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await db.disconnect()
    logger.info("AI Processor service stopped")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-processor",
        "timestamp": datetime.utcnow().isoformat(),
        "model_loaded": evaluator.is_initialized
    }


@app.post("/evaluate")
async def evaluate_question(
    request: EvaluationRequest,
    background_tasks: BackgroundTasks
):
    """
    Evaluate a question's value asynchronously
    """
    try:
        # Add evaluation task to background
        background_tasks.add_task(
            process_evaluation,
            request.questionId
        )
        
        return {
            "status": "evaluation_started",
            "questionId": request.questionId
        }
    except Exception as e:
        logger.error(f"Failed to start evaluation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def process_evaluation(question_id: str):
    """
    Process question evaluation in background
    """
    try:
        # Fetch question data from database
        question_data = await db.get_question_with_context(question_id)
        
        if not question_data:
            logger.error(f"Question not found: {question_id}")
            return
        
        # Evaluate the question
        scores = await evaluator.evaluate_question(question_data)
        
        # Calculate total score
        total_score = evaluator.calculate_total_score(scores)
        
        # Save evaluation result
        await db.save_evaluation(
            question_id=question_id,
            scores=scores,
            total_score=total_score
        )
        
        logger.info(f"Evaluation completed for question {question_id}: {total_score}")
        
    except Exception as e:
        logger.error(f"Evaluation failed for question {question_id}: {str(e)}")


@app.post("/similarity")
async def find_similar_questions(request: SimilarityRequest):
    """
    Find similar questions based on semantic similarity
    """
    try:
        # Get question embedding
        embedding = await evaluator.get_embedding(request.text)
        
        # Find similar questions
        similar_questions = await db.find_similar_questions(
            embedding=embedding,
            limit=request.limit,
            min_score=request.minScore
        )
        
        return {
            "questions": similar_questions,
            "count": len(similar_questions)
        }
    except Exception as e:
        logger.error(f"Similarity search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-keywords")
async def analyze_keywords(text: str):
    """
    Extract keywords from text
    """
    try:
        keywords = await evaluator.extract_keywords(text)
        return {"keywords": keywords}
    except Exception as e:
        logger.error(f"Keyword extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 3003))
    )