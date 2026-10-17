import os
from dotenv import load_dotenv

load_dotenv()
import json
import re
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from groq import Groq

router = APIRouter(prefix="/analytics", tags=["analytics"])

groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)
LLM_MODEL   = "openai/gpt-oss-120b"

# ======================================================
# REQUEST MODEL
# ======================================================

class ActivityItem(BaseModel):
    module: str
    topic:  str
    score:  float
    date:   str

class AnalyzeRequest(BaseModel):
    user_id:            str   = "1"
    skills:             str   = ""
    aptitude_avg:       float = 0
    coding_avg:         float = 0
    interview_avg:      float = 0
    aptitude_sessions:  int   = 0
    coding_sessions:    int   = 0
    interview_sessions: int   = 0
    recent_activity:    List[ActivityItem] = []

# ======================================================
# HELPER
# ======================================================

def call_llm(prompt: str) -> str:
    res = groq_client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,  # lower temp — we want consistent reasoning, not creative variance
    )
    return res.choices[0].message.content.strip()

# ======================================================
# AGENTIC ANALYZE ENDPOINT
# ======================================================
# NOTE: Unlike a rule-based version, this endpoint does NOT pre-compute
# overall score, trend, or recommendations in Python. It sends the LLM
# the raw, chronologically-ordered activity log for every module and lets
# the model reason over that history itself — deciding its own weighting,
# detecting trajectory by comparing earlier vs later attempts, and forming
# its own recommendation. Python only does data plumbing (DB -> LLM -> JSON),
# never the judgment calls.
# ======================================================

@router.post("/analyze")
def analyze(req: AnalyzeRequest):

    total_sessions = req.aptitude_sessions + req.coding_sessions + req.interview_sessions

    # Sort activity oldest -> newest so the LLM can actually observe trajectory
    sorted_activity = sorted(req.recent_activity, key=lambda a: a.date)

    if sorted_activity:
        activity_lines = "\n".join(
            f"{i+1}. [{a.date}] {a.module} — {a.topic} — Score: {int(a.score)}"
            for i, a in enumerate(sorted_activity)
        )
    else:
        activity_lines = "No activity recorded yet."

    prompt = f"""You are an autonomous AI placement-readiness analyst. You are NOT filling in a template — you must genuinely reason over the data below and form your own independent judgments. Do not apply any fixed formula; decide your own approach based on what the data actually shows.

CANDIDATE CONTEXT:
- Target skills / role: {req.skills or "Not specified"}
- Total practice sessions completed: {total_sessions}
- Aptitude sessions: {req.aptitude_sessions} | Coding sessions: {req.coding_sessions} | Interview sessions: {req.interview_sessions}

RAW ACTIVITY LOG (chronological order, oldest first — use this to detect real trends, not just current averages):
{activity_lines}

YOUR TASK — reason step by step internally (do not show your reasoning, only output the final JSON):

1. READINESS SCORE: Look at all the data holistically. Decide what placement readiness score (0-100) this candidate genuinely deserves right now. You may weigh interview performance more heavily since that's typically the final and most decisive round, but use your own judgment based on what you actually see in the data — don't apply a fixed percentage formula. If a module has zero sessions, that is a real gap and should pull the score down, not be ignored.

2. TREND ANALYSIS: For each module (aptitude, coding, interview), compare the EARLIER attempts in the log against the LATER attempts for that same module. If scores are rising over time -> "Improving". If roughly flat -> "Stable". If falling, or if there's only one data point and it's weak -> "Needs Attention". If zero sessions exist for a module, mark it "Needs Attention" since it hasn't been started.

3. NEXT ACTION: Based on everything above, decide the single most impactful thing this candidate should do next. This should be your own reasoned judgment — which module/topic, if practiced next, would most improve their actual placement chances given their current gaps? Justify it by citing the real numbers from the data.

4. TOPIC HEATMAP: From the activity log, identify 4-6 actual topics practiced (use the exact topic names seen in the log) and assess each honestly.

5. CONFIDENCE STATEMENT: Write one honest, specific sentence summarizing where this candidate genuinely stands — name what's working and what the main gap to placement readiness is.

Return ONLY this raw JSON object — no markdown, no backticks, no commentary, no explanation of your reasoning:

{{
  "readiness_score": <integer 0-100>,
  "readiness_label": "<one of: Not Ready | Learning | Almost Ready | Interview Ready | Placement Ready>",
  "confidence_text": "<one honest, specific sentence>",
  "topic_heatmap": [
    {{"topic": "<exact topic name from log>", "score": <integer 0-100>, "status": "<Strong|Improving|Weak>"}}
  ],
  "trend": {{
    "aptitude": "<Improving|Stable|Needs Attention>",
    "coding": "<Improving|Stable|Needs Attention>",
    "interview": "<Improving|Stable|Needs Attention>"
  }},
  "next_action": {{
    "module": "<Aptitude|Coding|Mock Interview>",
    "topic": "<specific topic, grounded in the candidate's actual weak area>",
    "difficulty": "<Easy|Medium|Hard>",
    "reason": "<one sentence citing the real score/data that justifies this recommendation>"
  }},
  "improvement_plan": {{
    "week1": "<specific actionable focus, grounded in actual weak areas>",
    "week2": "<specific actionable focus>",
    "week3": "<specific actionable focus>",
    "week4": "<specific actionable focus>"
  }},
  "daily_challenge": "<one concrete, specific task for today>",
  "weak_areas": ["<topic>", "<topic>"],
  "strengths": ["<topic>", "<topic>"]
}}

Be honest and specific. Do not be generically encouraging if the data doesn't support it — an honest "Not Ready" assessment is more useful to this candidate than false reassurance. If there isn't enough data yet (fewer than 3 total sessions), say so plainly in confidence_text and keep the readiness_score conservative."""

    try:
        raw = call_llm(prompt)
        # strip possible markdown fences
        raw = re.sub(r"```(?:json)?", "", raw).strip().strip("`").strip()
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        data = json.loads(match.group() if match else raw)
        return {"success": True, "analysis": data}

    except Exception as e:
        print("ANALYTICS ERROR:", e)
        # Minimal safe fallback — only used if the LLM call itself fails
        # (network/parsing error), not a substitute reasoning path.
        return {
            "success": True,
            "analysis": {
                "readiness_score": 0,
                "readiness_label": "Learning",
                "confidence_text": "We couldn't generate a full analysis right now — please try refreshing.",
                "topic_heatmap": [],
                "trend": {
                    "aptitude": "Stable",
                    "coding": "Stable",
                    "interview": "Stable",
                },
                "next_action": {
                    "module": "Mock Interview" if req.interview_sessions == 0 else "Aptitude",
                    "topic": "General Practice",
                    "difficulty": "Easy",
                    "reason": "Start building a baseline across all modules.",
                },
                "improvement_plan": {
                    "week1": "Identify and revise weak concepts",
                    "week2": "Solve 3 coding problems daily",
                    "week3": "Give 2 mock interviews",
                    "week4": "Full revision and timed practice tests",
                },
                "daily_challenge": "Solve 3 coding problems and revise one core concept",
                "weak_areas": [],
                "strengths": [],
            }
        }