import os
from dotenv import load_dotenv

load_dotenv()
import re
from fastapi import APIRouter
from pydantic import BaseModel
from google import genai
from google.genai import types
from groq import Groq

# ======================================================
# ROUTER
# ======================================================

router = APIRouter(prefix="/aptitude", tags=["Aptitude"])

# ======================================================
# GEMINI CLIENT  —  reuse same config as main.py
# ======================================================



groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

def call_gemini(prompt: str) -> str:  # keep same name, just swap inside
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",  # free, fast, smart
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content.strip()


# ======================================================
# REQUEST MODELS
# ======================================================

class QuizRequest(BaseModel):
    category: str    # "General Aptitude" or "Technical Aptitude"
    topic: str       # "Java", "SQL", "Logical Reasoning", etc.

class FeedbackRequest(BaseModel):
    topic: str
    score: int
    total: int
    wrong_questions: list[str]   # list of questions the user got wrong
    correct_answers: list[str]   # corresponding correct answers

# ======================================================
# GENERATE QUIZ  —  10 MCQs
# ======================================================

@router.post("/generate-quiz")
def generate_quiz(req: QuizRequest):
    prompt = f"""You are an expert placement preparation coach.
Generate exactly 10 medium-difficulty MCQ questions for "{req.topic}" under "{req.category}" for placement interview preparation.

Return ONLY a valid JSON array (no markdown, no explanation, no backticks) like:
[
  {{
    "question": "...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct": "A) ..."
  }}
]

Rules:
- Questions must be placement-relevant and medium difficulty
- Each question has exactly 4 options labeled A), B), C), D)
- "correct" must exactly match one of the options
- Questions must be unique and varied across concepts
- No repeated questions
- Return only the raw JSON array, absolutely nothing else
"""

    try:
        raw = call_gemini(prompt)
        cleaned = raw.replace("```json", "").replace("```", "").strip()

        import json
        questions = json.loads(cleaned)

        if not isinstance(questions, list) or len(questions) == 0:
            raise ValueError("Invalid response format")

        return {"success": True, "questions": questions}

    except Exception as e:
        return {"success": False, "error": str(e), "questions": []}

# ======================================================
# GENERATE AI FEEDBACK
# ======================================================

@router.post("/generate-feedback")
def generate_feedback(req: FeedbackRequest):
    accuracy = round((req.score / req.total) * 100)

    wrong_section = ""
    if req.wrong_questions:
        wrong_section = "\n".join(
            f"- Q: {q}\n  Correct Answer: {a}"
            for q, a in zip(req.wrong_questions, req.correct_answers)
        )
    else:
        wrong_section = "None — all answers were correct!"

    prompt = f"""A student just completed a placement preparation quiz on "{req.topic}".
Score: {req.score}/{req.total} ({accuracy}% accuracy)

Questions answered incorrectly:
{wrong_section}

Provide a structured JSON response (no markdown, no backticks, raw JSON only) like:
{{
  "strengths": ["specific strength 1", "specific strength 2"],
  "weakAreas": ["specific weak area 1", "specific weak area 2"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
  "readiness": "Beginner",
  "summary": "One encouraging sentence personalized to their performance."
}}

Rules:
- "readiness" must be exactly one of: "Beginner", "Intermediate", "Placement-Ready"
- Strengths and weak areas must be specific to {req.topic}, not generic
- Suggestions must be actionable study recommendations
- Return only raw JSON, no extra text
"""

    try:
        raw = call_gemini(prompt)
        cleaned = raw.replace("```json", "").replace("```", "").strip()

        import json
        feedback = json.loads(cleaned)

        return {"success": True, "feedback": feedback}

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "feedback": {
                "strengths": [],
                "weakAreas": [],
                "suggestions": [],
                "readiness": "Beginner",
                "summary": "Could not generate feedback. Please try again."
            }
        }