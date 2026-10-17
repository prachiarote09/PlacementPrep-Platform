import os
from dotenv import load_dotenv

load_dotenv()
import re
import json
from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq

# ======================================================
# ROUTER
# ======================================================

router = APIRouter(prefix="/coding", tags=["Coding"])

# ======================================================
# GROQ CLIENT
# ======================================================

groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)
GROQ_MODEL = "openai/gpt-oss-120b"

def call_groq(prompt: str, max_tokens: int = 2048) -> str:
    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=0.8,
    )
    return response.choices[0].message.content.strip()

# ======================================================
# IN-MEMORY PROGRESS STORE
# ======================================================

progress_store = {}

# ======================================================
# REQUEST MODELS
# ======================================================

class QuestionRequest(BaseModel):
    category: str
    difficulty: str
    asked_titles: list[str] = []

class EvaluateRequest(BaseModel):
    user_id: str
    question_title: str
    question_statement: str
    category: str
    difficulty: str
    user_code: str
    language: str = "python"

class HintRequest(BaseModel):
    question_title: str
    question_statement: str
    hint_level: int = 1

# ======================================================
# GENERATE CODING QUESTION
# ======================================================

@router.post("/generate-coding-question")
def generate_coding_question(req: QuestionRequest):
    asked_section = ""
    if req.asked_titles:
        asked_section = f"\nAvoid these already asked questions: {', '.join(req.asked_titles)}\n"

    prompt = f"""You are an expert coding interview coach for placement preparation.

Generate a {req.difficulty} difficulty coding problem for the topic: {req.category}
{asked_section}
Return ONLY a valid JSON object (no markdown, no backticks, raw JSON only):
{{
  "title": "Problem title here",
  "statement": "Full problem description with clear explanation",
  "sample_input": "Example input here",
  "sample_output": "Expected output here",
  "constraints": "Time/space constraints and input limits",
  "hints": ["Hint 1 - gentle nudge", "Hint 2 - more specific", "Hint 3 - approach guide"],
  "expected_approach": "Brief explanation of optimal approach and algorithm",
  "time_complexity": "O(?)",
  "space_complexity": "O(?)",
  "tags": ["tag1", "tag2", "tag3"]
}}

Rules:
- Statement must be detailed (4-6 sentences minimum)
- Sample input/output must be concrete and realistic
- Constraints must be specific (e.g., 1 <= n <= 10^5)
- Hints must be progressive (easy → medium → hard hint)
- Tags must be relevant to {req.category} and algorithm type
- Difficulty must match: {req.difficulty}
- Return ONLY the raw JSON, nothing else"""

    try:
        raw = call_groq(prompt)
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        # Extract JSON object
        match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if match:
            data = json.loads(match.group())
        else:
            data = json.loads(cleaned)

        return {"success": True, "question": data}

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "question": {}
        }

# ======================================================
# GET AI HINT
# ======================================================

@router.post("/get-hint")
def get_hint(req: HintRequest):
    prompt = f"""You are a coding interview mentor.

Problem: {req.question_title}
{req.question_statement}

Give hint level {req.hint_level} out of 3.
- Level 1: Very gentle nudge about the general approach
- Level 2: Mention the data structure or algorithm to use
- Level 3: Give the key insight or pseudocode outline

Return ONLY a JSON object:
{{
  "hint": "Your hint text here",
  "level": {req.hint_level}
}}"""

    try:
        raw = call_groq(prompt, max_tokens=512)
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        data = json.loads(match.group() if match else cleaned)
        return {"success": True, "hint": data.get("hint", ""), "level": req.hint_level}
    except Exception as e:
        return {"success": False, "hint": "Think about the optimal data structure for this problem.", "level": req.hint_level}

# ======================================================
# EVALUATE CODE
# ======================================================

@router.post("/evaluate-code")
def evaluate_code(req: EvaluateRequest):
    prompt = f"""You are an expert coding interview evaluator assessing placement candidates.

Problem: {req.question_title}
Problem Statement: {req.question_statement}
Category: {req.category} | Difficulty: {req.difficulty}
Selected Language: {req.language}

Candidate's Code:
```
{req.user_code}
```

STEP 1 — LANGUAGE CHECK (do this first, before anything else):
The Selected Language is: {req.language}

Look at the candidate's code syntax carefully. Only flag a mismatch if you are CERTAIN the code is written in a CLEARLY DIFFERENT language family than {req.language} (e.g. selected language is "python" but code has zero Python syntax and is unmistakably Java/C++/JavaScript).

IMPORTANT: If the code's syntax is consistent with {req.language} in ANY reasonable interpretation, treat it as a MATCH. Do not flag a mismatch unless you are fully confident — when in doubt, assume it matches and proceed to STEP 2.

Only respond with the mismatch JSON if the mismatch is obvious and undeniable:

If the code's actual syntax does NOT match the selected language (e.g. selected language is "python" but the code uses Java syntax like "public class", "System.out.println", semicolons, curly braces for blocks, etc.), respond with ONLY this JSON and nothing else:
{{
  "language_mismatch": true,
  "detected_language": "<actual language you detected>",
  "selected_language": "{req.language}",
  "message": "Your code appears to be written in <detected language>, but you selected {req.language}. Please rewrite your solution in {req.language}, or change the language selector to match your code."
}}

STEP 2 — Only if the language matches, evaluate the code thoroughly across all dimensions and return ONLY this raw JSON object (no markdown):
{{
  "language_mismatch": false,
  "score": <integer 0-100>,
  "correctness": <integer 0-100>,
  "optimization": <integer 0-100>,
  "readability": <integer 0-100>,
  "edge_cases": <integer 0-100>,
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
  "time_complexity": "O(?)",
  "space_complexity": "O(?)",
  "interview_readiness": "Not Ready | Needs Practice | Interview Ready | Excellent",
  "summary": "2-3 sentence personalized feedback summary"
}}

Be honest, specific, and constructive. Score 0 if code is empty or completely wrong. Return ONLY ONE of the two JSON objects above, nothing else."""

    try:
        raw = call_groq(prompt, max_tokens=1500)
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        result = json.loads(match.group() if match else cleaned)

        # ── Handle language mismatch ──
        if result.get("language_mismatch"):
            return {
                "success": False,
                "language_mismatch": True,
                "error": result.get(
                    "message",
                    f"Your code doesn't appear to be written in {req.language}. Please check the language selector."
                ),
            }

        evaluation = result

        # Update progress
        uid = req.user_id
        if uid not in progress_store:
            progress_store[uid] = {
                "attempted": 0, "solved": 0, "scores": [],
                "categories": {}, "streak": 0
            }

        p = progress_store[uid]
        p["attempted"] += 1
        score = evaluation.get("score", 0)
        p["scores"].append(score)
        if score >= 60:
            p["solved"] += 1

        cat = req.category
        if cat not in p["categories"]:
            p["categories"][cat] = {"attempted": 0, "scores": []}
        p["categories"][cat]["attempted"] += 1
        p["categories"][cat]["scores"].append(score)

        return {"success": True, "evaluation": evaluation}

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "evaluation": {
                "score": 0, "correctness": 0, "optimization": 0,
                "readability": 0, "edge_cases": 0,
                "strengths": [], "weaknesses": ["Could not evaluate code"],
                "suggestions": ["Please try again"],
                "time_complexity": "Unknown", "space_complexity": "Unknown",
                "interview_readiness": "Not Ready",
                "summary": "Evaluation failed. Please try again."
            }
        }

# ======================================================
# GET PROGRESS
# ======================================================

@router.get("/coding-result/{user_id}")
def get_result(user_id: str):
    if user_id not in progress_store:
        return {
            "user_id": user_id,
            "attempted": 0, "solved": 0,
            "average_score": 0, "streak": 0,
            "categories": {}, "scores": []
        }

    p = progress_store[user_id]
    avg = round(sum(p["scores"]) / len(p["scores"]), 1) if p["scores"] else 0

    # Find strongest/weakest
    cat_avgs = {}
    for cat, data in p["categories"].items():
        if data["scores"]:
            cat_avgs[cat] = round(sum(data["scores"]) / len(data["scores"]), 1)

    strongest = max(cat_avgs, key=cat_avgs.get) if cat_avgs else None
    weakest = min(cat_avgs, key=cat_avgs.get) if cat_avgs else None

    return {
        "user_id": user_id,
        "attempted": p["attempted"],
        "solved": p["solved"],
        "average_score": avg,
        "streak": p["streak"],
        "categories": p["categories"],
        "category_averages": cat_avgs,
        "strongest_topic": strongest,
        "weakest_topic": weakest,
        "scores": p["scores"]
    }