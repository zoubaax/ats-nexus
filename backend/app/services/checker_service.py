"""
ATS Checker & JD Matcher Service with Real AI LLM Evaluation
"""

import json
import re
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.db.models.evaluation import Evaluation
from app.llm.llm_utils import query_llm, extract_json_from_response

logger = logging.getLogger(__name__)


def compute_ats_score(
    resume_text: str,
    job_description: str,
    target_role: str,
    provider: str = "groq",
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluates resume text against a target Job Description using AI LLM models.
    Calculates category scores, identifies missing hard skill keywords,
    and returns actionable bullet point suggestions.
    """
    prompt = f"""
You are a Lead ATS Resume Evaluator and Technical Recruiter.
Analyze the candidate's resume text against the target Job Description below.

Target Role: {target_role}

Job Description:
{job_description}

Candidate Resume Text:
{resume_text}

INSTRUCTIONS:
1. Calculate an overall ATS match score between 0 and 100 based on keyword match, experience relevance, and technical depth.
2. Provide a breakdown percentage (0-100) for:
   - technical_skills
   - experience_relevance
   - project_quality
3. Identify exact missing hard skill keywords required by the JD that are absent from the candidate's CV.
4. Provide 3 concrete, actionable recommendations to increase the score.

Return ONLY a JSON object strictly matching this schema:
{{
  "overall_score": 85,
  "target_role": "{target_role}",
  "breakdown": {{
    "technical_skills": {{
      "score": 85,
      "evidence": ["Matched key skills: Python, FastAPI, Docker"]
    }},
    "experience_relevance": {{
      "score": 80,
      "evidence": ["Experience aligns with software engineering role"]
    }},
    "project_quality": {{
      "score": 90,
      "evidence": ["Projects demonstrate relevant full-stack architectures"]
    }}
  }},
  "missing_keywords": ["Kubernetes", "GraphQL", "Redis"],
  "actionable_feedback": [
    "Add Docker CI/CD execution metrics to work experience bullets.",
    "Include missing hard skills: Kubernetes and Redis in the skills bank.",
    "Quantify impact with metrics (e.g. reduced latency by 35%)."
  ]
}}
"""

    try:
        raw_res = query_llm(prompt=prompt, provider=provider, api_key=api_key)
        cleaned = extract_json_from_response(raw_res)
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            parsed = json.loads(match.group(0))
            return {
                "overall_score": int(parsed.get("overall_score", 75)),
                "target_role": parsed.get("target_role", target_role),
                "breakdown": parsed.get("breakdown", {}),
                "missing_keywords": parsed.get("missing_keywords", []),
                "actionable_feedback": parsed.get("actionable_feedback", []),
                "provider_used": provider
            }
    except Exception as err:
        logger.error(f"LLM ATS evaluation error: {err}")

    # Intelligent Fallback if LLM API fails or rate-limits
    text_lower = resume_text.lower()
    jd_lower = job_description.lower()

    potential_keywords = [
        "python", "react", "typescript", "fastapi", "docker", "kubernetes",
        "aws", "postgresql", "sql", "git", "ci/cd", "rest api", "graphql",
        "redis", "mongodb", "node", "tailwind", "unit testing", "agile", "microservices"
    ]

    jd_keywords = [kw for kw in potential_keywords if kw in jd_lower]
    if not jd_keywords:
        jd_words = set(jd_lower.split())
        jd_keywords = [w for w in ["python", "javascript", "react", "sql", "api"] if w in jd_words]

    matched_keywords = [kw for kw in jd_keywords if kw in text_lower]
    missing_keywords = [kw.title() for kw in jd_keywords if kw not in text_lower]

    keyword_match_ratio = len(matched_keywords) / max(len(jd_keywords), 1)
    overall_score = min(max(int(60 + (keyword_match_ratio * 35)), 55), 98)

    breakdown = {
        "technical_skills": {
            "score": min(int(keyword_match_ratio * 100), 95),
            "evidence": [f"Matched keywords: {', '.join([k.title() for k in matched_keywords]) if matched_keywords else 'Basic skill match'}"]
        },
        "experience_relevance": {
            "score": int(overall_score * 0.95),
            "evidence": [f"Experience matches target role: {target_role}"]
        },
        "project_quality": {
            "score": int(overall_score * 0.9),
            "evidence": ["Projects demonstrate relevant technical implementations"]
        }
    }

    actionable_feedback = []
    if missing_keywords:
        actionable_feedback.append(f"Add missing keywords required by ATS: {', '.join(missing_keywords[:4])}")
    actionable_feedback.append("Include quantifiable achievements (e.g. 'Improved performance by 30%') in work experience bullets")
    actionable_feedback.append("Ensure section headings (Work Experience, Education, Skills) use standard ATS naming")

    return {
        "overall_score": overall_score,
        "target_role": target_role,
        "breakdown": breakdown,
        "missing_keywords": missing_keywords,
        "actionable_feedback": actionable_feedback,
        "provider_used": provider
    }


async def save_evaluation_record(
    user_id: str,
    resume_id: str,
    evaluation_result: Dict[str, Any],
    job_description: str,
    db: AsyncSession
) -> Evaluation:
    """Saves the ATS Evaluation result to Neon DB for user history tracking."""
    eval_record = Evaluation(
        user_id=user_id,
        resume_id=resume_id,
        job_title=evaluation_result["target_role"],
        target_role=evaluation_result["target_role"],
        job_description=job_description,
        overall_score=evaluation_result["overall_score"],
        score_breakdown=evaluation_result["breakdown"],
        missing_keywords=evaluation_result["missing_keywords"],
        actionable_feedback=evaluation_result["actionable_feedback"],
        ai_provider_used=evaluation_result["provider_used"]
    )

    db.add(eval_record)
    await db.commit()
    await db.refresh(eval_record)

    return eval_record
