import uuid
import re
import os
from dotenv import load_dotenv

load_dotenv()
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from aptitude import router as aptitude_router
from coding import router as coding_router
from groq import Groq
from analytics import router as analytics_router

# ======================================================
# GROQ CONFIG
# ======================================================

groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)
LLM_MODEL     = "llama-3.3-70b-versatile"
WHISPER_MODEL = "whisper-large-v3"

# ======================================================
# APP
# ======================================================

app = FastAPI(title="Placement Prep AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(aptitude_router)
app.include_router(coding_router)
app.include_router(analytics_router)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ======================================================
# MEMORY
# ======================================================

sessions = {}

FIXED_QUESTIONS = [
    "Tell me about yourself.",
    # "Tell me about your projects and internship experience.",
    # "Why should we hire you?"
]

# ======================================================
# REQUEST MODELS
# ======================================================

class TranscriptResponse(BaseModel):
    transcript: str
    language: str
    duration_seconds: float


class StartInterviewRequest(BaseModel):
    user_id: str
    skills: str
    job_description: str = ""
    question_count: int = 5
    interview_type: str = "Technical"   # Technical | HR | Mixed
    difficulty: str = "Medium"          # Easy | Medium | Hard


class AnswerRequest(BaseModel):
    user_id: str
    answer: str

# ======================================================
# HELPER — call LLM
# ======================================================

def call_llm(prompt: str) -> str:
    response = groq_client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content.strip()

# ======================================================
# HEALTH
# ======================================================

@app.get("/health")
def health():
    return {
        "status": "ok",
        "speech_model": WHISPER_MODEL,
        "llm_model": LLM_MODEL
    }

# ======================================================
# TRANSCRIBE AUDIO  —  uses Groq Whisper Large V3 API
# ======================================================

# Common Whisper hallucinations on silence
WHISPER_HALLUCINATIONS = {
    "thanks for watching", "thank you for watching",
    "please subscribe", "subscribe", "like and subscribe",
    "see you next time", "bye", "goodbye", "thank you",
    "you", ".", ",", "...", "the", "a",
    # ADD THESE — very common Whisper silence hallucinations
    "this is the first time i've seen this",
    "this is the first time i've seen this.",
    "i've seen this", "i'm sorry", "i don't know",
    "hmm", "um", "uh", "okay", "ok",
    "thank you for your time",
    "thank you for listening",
    "i'll see you in the next video",
    "don't forget to like",
    "music",
    "[music]", "[silence]", "[noise]",
    "foreign", "[foreign]",
    "subtitles by", "subtitles",
}

@app.post("/transcribe", response_model=TranscriptResponse)
async def transcribe(audio: UploadFile = File(...)):
    allowed_types = {
        "audio/wav", "audio/mpeg", "audio/ogg", "audio/webm", "audio/mp4",
        "application/octet-stream", "video/webm", "video/mp4"
    }
    if audio.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported type: {audio.content_type}")

    file_ext  = audio.filename.split(".")[-1] if "." in audio.filename else "webm"
    temp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}.{file_ext}")

    try:
        contents = await audio.read()

        # ── Fix 0: Block tiny files — under 10KB is definitely silence ──
        if len(contents) < 10_000:
            print(f"Audio too small: {len(contents)} bytes, skipping Whisper")
            return TranscriptResponse(transcript="", language="en", duration_seconds=0.0)

        with open(temp_path, "wb") as f:
            f.write(contents)

        with open(temp_path, "rb") as af:
            transcription = groq_client.audio.transcriptions.create(
                file=(os.path.basename(temp_path), af),
                model=WHISPER_MODEL,
                language="en",
                response_format="verbose_json"
            )

        transcript = transcription.text.strip()
        language   = getattr(transcription, "language", "en")
        duration   = float(getattr(transcription, "duration", 0.0))

        # ── Fix 1: Block short recordings under 2 seconds ──
        if duration < 2.0:
            print(f"Audio too short: {duration}s, clearing transcript")
            return TranscriptResponse(transcript="", language=language, duration_seconds=duration)

        # ── Fix 2: Check no_speech_prob from segments ──
        segments = getattr(transcription, "segments", []) or []
        if segments:
            avg_no_speech = sum(
                s.get("no_speech_prob", 0) if isinstance(s, dict)
                else getattr(s, "no_speech_prob", 0)
                for s in segments
            ) / len(segments)
            if avg_no_speech > 0.4:   # lowered threshold from 0.5 to 0.4
                print(f"Silence detected (no_speech_prob={avg_no_speech:.2f}), clearing")
                transcript = ""

        # ── Fix 3: Block known hallucination phrases ──
        if transcript.lower().strip(".!, ") in WHISPER_HALLUCINATIONS:
            print(f"Hallucination blocked: '{transcript}'")
            transcript = ""

        # ── Fix 4: Under 4 words = noise ──
        if transcript and len(transcript.split()) < 4:
            print(f"Too short transcript: '{transcript}', clearing")
            transcript = ""

        return TranscriptResponse(
            transcript=transcript,
            language=language,
            duration_seconds=round(duration, 2)
        )

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

# ======================================================
# GENERATE DYNAMIC QUESTION
# ======================================================

def generate_dynamic_question(
    skills: str,
    job_description: str,
    asked_questions: list,
    interview_type: str,
    difficulty: str
) -> str:

    jd_section = (
        f"\nJob Description:\n{job_description}"
        if job_description.strip()
        else ""
    )

    asked_formatted = "\n".join(f"- {q}" for q in asked_questions)

    # Difficulty guidance
    difficulty_guide = {
        "Easy":   "Ask straightforward conceptual questions suitable for freshers with basic knowledge.",
        "Medium": "Ask moderately complex questions that require understanding and some experience.",
        "Hard":   "Ask advanced, scenario-based or design questions that challenge even experienced candidates."
    }.get(difficulty, "Ask moderately complex questions.")

    # Interview type guidance
    type_guide = {
        "Technical": "Focus entirely on technical concepts, coding, system design, and tools from the candidate's skills.",
        "HR":        "Focus on behavioural, situational, and soft-skill questions. Avoid deep technical content.",
        "Mixed":     "Alternate between technical questions and behavioural / situational HR-style questions."
    }.get(interview_type, "Focus on technical concepts.")

    prompt = f"""You are an experienced interviewer conducting a placement interview.

Candidate Skills: {skills}{jd_section}

Interview Type: {interview_type}
Difficulty: {difficulty}

Type Guidance: {type_guide}
Difficulty Guidance: {difficulty_guide}

Already Asked Questions:
{asked_formatted}

Generate ONE fresh interview question following the above guidance.

Rules:
- Do NOT repeat or rephrase any already asked question
- Return ONLY the question text, no preamble, no numbering, no markdown
"""

    try:
        question = call_llm(prompt)
        question = question.replace("*", "").replace('"', "").strip()
        return question

    except Exception as e:
        print("QUESTION ERROR:", e)
        return "Explain the difference between synchronous and asynchronous programming with a real-world example."

# ======================================================
# EVALUATE ANSWER
# ======================================================

def evaluate_answer(
    question: str,
    answer: str,
    skills: str,
    job_description: str,
    difficulty: str
) -> dict:

    jd_section = (
        f"\nJob Description Context:\n{job_description}"
        if job_description.strip()
        else ""
    )

    difficulty_guide = {
        "Easy":   "This was an easy question. Be generous with scoring if the core concept is correct.",
        "Medium": "This was a medium-difficulty question. Reward depth and clarity.",
        "Hard":   "This was a hard question. Only give high scores if the answer is thorough, accurate, and well-explained."
    }.get(difficulty, "")

    prompt = f"""You are an expert interviewer evaluating a candidate for a placement interview.

Candidate Skills: {skills}{jd_section}
Difficulty Level: {difficulty}
Scoring Guidance: {difficulty_guide}

Interview Question:
{question}

Candidate's Answer:
{answer}

Evaluate the candidate based on:
1. Technical accuracy
2. Depth of explanation
3. Real-world understanding
4. Communication clarity
5. Confidence & completeness

Return your evaluation STRICTLY in this format (no markdown, no extra text):

"Score: <integer 0-100 — be strict and realistic, most answers should score between 40-75 unless exceptional>"

Feedback:
<4-6 lines of personalised, detailed feedback>

Strengths:
- <specific strength>
- <specific strength>

Improvements:
- <specific, actionable improvement>
- <specific, actionable improvement>
"""

    try:
        result = call_llm(prompt)

        print("========== LLM EVALUATION ==========")
        print(result)
        print("=====================================")

        score_match = re.search(r"Score:\s*(\d+)", result)
        score = int(score_match.group(1)) if score_match else 55
        score = max(0, min(100, score))

        feedback_match = re.search(
            r"Feedback:\s*(.*?)(Strengths:|$)", result, re.DOTALL
        )
        feedback = (
            feedback_match.group(1).strip()
            if feedback_match
            else "Unable to parse detailed feedback."
        )

        strengths_match = re.search(
            r"Strengths:\s*(.*?)(Improvements:|$)", result, re.DOTALL
        )
        strengths = (
            strengths_match.group(1).strip()
            if strengths_match
            else "- Attempted the question"
        )

        improvements_match = re.search(
            r"Improvements:\s*(.*)", result, re.DOTALL
        )
        improvements = (
            improvements_match.group(1).strip()
            if improvements_match
            else "- Work on deeper explanation"
        )

        return {
            "score": score,
            "feedback": feedback,
            "strengths": strengths,
            "improvements": improvements
        }

    except Exception as e:
        print("EVALUATION ERROR:", e)
        return {
            "score": 50,
            "feedback": f"Evaluation error: {str(e)}",
            "strengths": "",
            "improvements": ""
        }

# ======================================================
# START INTERVIEW
# ======================================================

@app.post("/start-interview")
def start_interview(req: StartInterviewRequest):

    # Cap dynamic questions so total = question_count
    # First 3 are fixed (or fewer if question_count < 3)
    fixed_count = min(len(FIXED_QUESTIONS), req.question_count)

    sessions[req.user_id] = {
        "skills": req.skills,
        "job_description": req.job_description,
        "question_count": req.question_count,
        "interview_type": req.interview_type,
        "difficulty": req.difficulty,
        "index": 0,
        "asked_questions": [],
        "scores": []
    }

    first_question = FIXED_QUESTIONS[0]
    sessions[req.user_id]["asked_questions"].append(first_question)

    return {
        "question": first_question,
        "type": "fixed",
        "question_number": 1,
        "total_questions": req.question_count
    }

# ======================================================
# SUBMIT ANSWER
# ======================================================

@app.post("/submit-answer")
def submit_answer(req: AnswerRequest):

    if req.user_id not in sessions:
        raise HTTPException(status_code=404, detail="Interview session not found")

    session = sessions[req.user_id]
    current_question = session["asked_questions"][-1]

    evaluation = evaluate_answer(
        question=current_question,
        answer=req.answer,
        skills=session["skills"],
        job_description=session["job_description"],
        difficulty=session["difficulty"]
    )

    session["scores"].append(evaluation["score"])
    session["index"] += 1
    idx = session["index"]

    total = session["question_count"]
    interview_complete = idx >= total

    next_question = None
    qtype = None

    if not interview_complete:
        if idx < len(FIXED_QUESTIONS):
            next_question = FIXED_QUESTIONS[idx]
            qtype = "fixed"
        else:
            next_question = generate_dynamic_question(
                skills=session["skills"],
                job_description=session["job_description"],
                asked_questions=session["asked_questions"],
                interview_type=session["interview_type"],
                difficulty=session["difficulty"]
            )
            qtype = "dynamic"

        session["asked_questions"].append(next_question)

    return {
        "score": evaluation["score"],
        "feedback": evaluation["feedback"],
        "strengths": evaluation["strengths"],
        "improvements": evaluation["improvements"],
        "next_question": next_question,
        "type": qtype,
        "question_number": idx + 1 if not interview_complete else total,
        "total_questions": total,
        "interview_complete": interview_complete
    }

# ======================================================
# FINAL RESULT
# ======================================================

@app.get("/result/{user_id}")
def result(user_id: str):

    if user_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[user_id]
    scores = session["scores"]
    avg = sum(scores) / len(scores) if scores else 0

    if avg < 40:
        performance = "Needs Improvement"
    elif avg < 70:
        performance = "Average"
    else:
        performance = "Good"

    return {
        "average_score": round(avg, 2),
        "performance": performance,
        "questions_asked": session["asked_questions"],
        "individual_scores": scores,
        "interview_type": session["interview_type"],
        "difficulty": session["difficulty"]
    }
def generate_final_feedback(session: dict) -> str:
    questions_and_scores = "\n".join(
        f"Q{i+1}: {q} → Score: {s}"
        for i, (q, s) in enumerate(zip(session["asked_questions"], session["scores"]))
    )
    avg = sum(session["scores"]) / len(session["scores"]) if session["scores"] else 0

    prompt = f"""You are an expert interviewer. A candidate just completed a mock placement interview.

Interview Type: {session["interview_type"]}
Difficulty: {session["difficulty"]}
Skills: {session["skills"]}

Questions and Scores:
{questions_and_scores}

Overall Average Score: {round(avg, 1)}

Write a comprehensive final interview report (6-8 lines) covering:
1. Overall performance summary
2. Key strengths demonstrated across the interview
3. Major areas to improve
4. Readiness for placements (honest assessment)

Be specific, honest, and constructive. No markdown, no bullet points, just plain paragraphs."""

    try:
        return call_llm(prompt)
    except Exception as e:
        return f"Average score: {round(avg, 1)}. Keep practicing to improve your performance."


@app.get("/final-result/{user_id}")
def final_result(user_id: str):
    if user_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[user_id]
    scores = session["scores"]
    avg = sum(scores) / len(scores) if scores else 0

    if avg < 40:
        performance = "Needs Improvement"
    elif avg < 70:
        performance = "Average"
    else:
        performance = "Good"

    overall_feedback = generate_final_feedback(session)

    return {
        "average_score": round(avg, 2),
        "performance": performance,
        "overall_feedback": overall_feedback,
        "questions_asked": session["asked_questions"],
        "individual_scores": scores,
        "interview_type": session["interview_type"],
        "difficulty": session["difficulty"]
    }