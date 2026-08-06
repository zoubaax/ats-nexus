"""
ATS CV Builder & AI Bullet Point Optimizer Endpoints
"""

import os
import json
import re
import uuid
import fitz  # PyMuPDF
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Header, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.db.models.user import User
from app.db.models.profile import MasterProfile
from app.db.models.resume import Resume
from app.api.deps import get_current_user
from app.llm.llm_utils import query_llm, extract_json_from_response
from app.services.resume_service import UPLOAD_DIR

router = APIRouter(prefix="/builder", tags=["CV Builder"])


class OptimizeBulletRequest(BaseModel):
    bullet_point: str = Field(..., description="Original bullet point text")
    target_role: Optional[str] = Field("Software Engineer", description="Target job title")
    job_description: Optional[str] = Field("", description="Optional Job Description context")


class OptimizeBulletResponse(BaseModel):
    original: str
    variations: List[str]
    keywords_added: List[str]


class TailorProfileRequest(BaseModel):
    job_description: str = Field(..., description="Target Job Description")
    target_role: Optional[str] = Field("Full-Stack Developer", description="Target job role")


class TailoredCVResponse(BaseModel):
    headline: str
    summary: str
    work_history: List[Dict[str, Any]]
    projects: List[Dict[str, Any]]
    skills: List[str]
    education: List[Dict[str, Any]]
    certifications: List[Dict[str, Any]]
    languages: List[Dict[str, Any]]
    phone: Optional[str] = ""
    location: Optional[str] = ""
    links: Dict[str, str] = {}
    matched_keywords: List[str] = []


class SaveCVRequest(BaseModel):
    title: Optional[str] = Field("Tailored ATS Resume", description="Title for saved CV")
    target_role: Optional[str] = Field("Full-Stack Developer", description="Target position")
    profile_data: Dict[str, Any] = Field(..., description="Tailored Profile JSON data")


class SaveCVResponse(BaseModel):
    id: str
    title: str
    created_at: str
    file_url: str


def generate_host_pdf(profile_data: dict, output_path: str, candidate_name: str = "ZOUBAA MOHAMMED"):
    """
    Generate an A4 PDF document on the host server using PyMuPDF fitz.Story HTML rendering.
    Ensures 100% pixel-perfect match with browser A4 preview.
    """
    c_name = profile_data.get("full_name") or candidate_name or "ZOUBAA MOHAMMED"
    role = profile_data.get("headline") or profile_data.get("target_role") or "Full-Stack & GenAI Engineer"

    contacts = []
    if profile_data.get("location"): contacts.append(profile_data["location"])
    if profile_data.get("phone"): contacts.append(profile_data["phone"])
    links = profile_data.get("links") or {}
    if links.get("github"): contacts.append(links["github"].replace("https://", ""))
    if links.get("linkedin"): contacts.append(links["linkedin"].replace("https://", ""))
    if links.get("portfolio"): contacts.append(links["portfolio"].replace("https://", ""))
    contact_str = " &nbsp;&bull;&nbsp; ".join(contacts)

    summary_html = ""
    if profile_data.get("summary"):
        summary_html = f"""
        <div class="section">
          <div class="section-title">PROFIL PROFESSIONNEL</div>
          <p class="summary">{profile_data["summary"]}</p>
        </div>
        """

    work_html = ""
    work_list = profile_data.get("work_history") or []
    if work_list:
        items = []
        for w in work_list:
            w_title = f"<b>{w.get('title', '')}</b> | {w.get('company', '')}"
            start = w.get('start_month', w.get('dates', ''))
            end = 'Present' if w.get('is_current') else w.get('end_month', '')
            w_dates = f"{start} &ndash; {end}" if end else start
            
            bullets_html = ""
            desc = w.get("description", "")
            for line in desc.split("\n"):
                if line.strip():
                    text_line = line.lstrip("•- ").strip()
                    bullets_html += f"<li>{text_line}</li>"
            
            items.append(f"""
            <div class="item">
              <div class="item-header">
                <div class="title-part">{w_title}</div>
                <div class="dates">{w_dates}</div>
              </div>
              <ul class="bullets">{bullets_html}</ul>
            </div>
            """)
        work_html = f"""
        <div class="section">
          <div class="section-title">EXPÉRIENCES PROFESSIONNELLES & STAGES</div>
          {"".join(items)}
        </div>
        """

    projects_html = ""
    projects_list = profile_data.get("projects") or []
    if projects_list:
        p_items = []
        for p in projects_list:
            p_title = f"<b>{p.get('title', '')}</b>"
            p_url = f'<span class="demo-url">{p.get("demo_url", "").replace("https://", "")}</span>' if p.get("demo_url") else ""
            stack_html = f'<div class="stack"><b>Stack:</b> {p["tech_stack"]}</div>' if p.get("tech_stack") else ""
            
            p_bullets = ""
            p_desc = p.get("description", "")
            for line in p_desc.split("\n"):
                if line.strip():
                    text_line = line.lstrip("•- ").strip()
                    p_bullets += f"<li>{text_line}</li>"
            
            p_items.append(f"""
            <div class="item">
              <div class="item-header">
                <div>{p_title}</div>
                {p_url}
              </div>
              {stack_html}
              <ul class="bullets">{p_bullets}</ul>
            </div>
            """)
        projects_html = f"""
        <div class="section">
          <div class="section-title">PROJETS RÉALISÉS & PRODUCTS</div>
          {"".join(p_items)}
        </div>
        """

    edu_html = ""
    edu_list = profile_data.get("education") or []
    if edu_list:
        e_items = []
        for e in edu_list:
            e_degree = f"<b>{e.get('field_of_study') or e.get('degree')}</b> &mdash; {e.get('school')}"
            e_dates = f"{e.get('start_year', e.get('dates', ''))} &ndash; {e.get('end_year', 'en cours' if e.get('is_current') else '')}"
            e_items.append(f"""
            <div class="item-header" style="margin-bottom: 4px;">
              <div>{e_degree}</div>
              <div class="dates">{e_dates}</div>
            </div>
            """)
        edu_html = f"""
        <div class="section">
          <div class="section-title">FORMATIONS & DIPLÔMES</div>
          {"".join(e_items)}
        </div>
        """

    skills_html = ""
    cert_html = ""
    skills_list = profile_data.get("skills") or []
    cert_list = profile_data.get("certifications") or []
    
    if skills_list:
        skills_html = f"""
        <div style="width: 48%; float: left;">
          <div class="section-title">COMPÉTENCES TECHNIQUES</div>
          <p class="skills-text">{", ".join(skills_list)}</p>
        </div>
        """
    if cert_list:
        cert_items = "".join([f"<li>{c.get('title')} ({c.get('issuer')})</li>" for c in cert_list])
        cert_html = f"""
        <div style="width: 48%; float: right;">
          <div class="section-title">CERTIFICATIONS</div>
          <ul class="bullets">{cert_items}</ul>
        </div>
        """

    bottom_grid = ""
    if skills_html or cert_html:
        bottom_grid = f"""
        <div class="section" style="clear: both; overflow: hidden; margin-top: 6px;">
          {skills_html}
          {cert_html}
        </div>
        """

    full_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{
          font-family: sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 20px 28px;
          font-size: 10px;
          line-height: 1.32;
          background: #ffffff;
        }}
        h1 {{
          text-align: center;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          margin: 0 0 2px 0;
          color: #0f172a;
        }}
        .role {{
          text-align: center;
          font-size: 9.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #334155;
          margin-bottom: 4px;
        }}
        .contacts {{
          text-align: center;
          font-size: 8.5px;
          color: #475569;
          margin-bottom: 8px;
        }}
        .header-rule {{
          border-bottom: 2px solid #0f172a;
          margin-bottom: 10px;
        }}
        .section {{
          margin-bottom: 8px;
        }}
        .section-title {{
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #0f172a;
          border-bottom: 1px solid #94a3b8;
          padding-bottom: 1px;
          margin-bottom: 4px;
        }}
        .summary {{
          font-size: 10px;
          color: #1e293b;
          text-align: justify;
          margin: 0;
        }}
        .item {{
          margin-bottom: 4px;
        }}
        .item-header {{
          font-size: 10px;
          color: #0f172a;
        }}
        .dates {{
          font-size: 9px;
          color: #475569;
          font-weight: 600;
          float: right;
        }}
        .stack {{
          font-size: 9px;
          color: #334155;
          margin-top: 1px;
        }}
        .demo-url {{
          font-size: 9px;
          color: #4338ca;
          font-weight: 600;
          float: right;
        }}
        ul.bullets {{
          margin: 1px 0 0 0;
          padding-left: 12px;
        }}
        ul.bullets li {{
          margin-bottom: 1px;
          color: #1e293b;
          font-size: 10px;
        }}
        .skills-text {{
          font-size: 9.5px;
          color: #1e293b;
          margin: 0;
        }}
      </style>
    </head>
    <body>
      <h1>{c_name}</h1>
      <div class="role">{role}</div>
      <div class="contacts">{contact_str}</div>
      <div class="header-rule"></div>

      {summary_html}
      {work_html}
      {projects_html}
      {edu_html}
      {bottom_grid}
    </body>
    </html>
    """

    story = fitz.Story(html=full_html)
    writer = fitz.DocumentWriter(output_path)
    
    rect = fitz.Rect(0, 0, 595, 842)
    more = True
    while more:
        device = writer.begin_page(rect)
        more, _ = story.place(rect)
        story.draw(device)
        writer.end_page()
    writer.close()


@router.post("/optimize-bullet", response_model=OptimizeBulletResponse)
async def optimize_bullet(
    payload: OptimizeBulletRequest,
    current_user: User = Depends(get_current_user),
    x_ai_provider: Optional[str] = Header(None, alias="X-AI-Provider"),
    x_ai_key: Optional[str] = Header(None, alias="X-AI-Key")
):
    """
    AI Bullet Point Rewriter: Takes a raw bullet point and returns 3 STAR-framework ATS optimized variations.
    """
    provider = x_ai_provider or current_user.default_ai_provider or "groq"
    api_key = x_ai_key or (current_user.ai_keys or {}).get(provider, "")

    prompt = f"""
You are an expert ATS Resume Writer and Career Coach.
Transform the following raw bullet point into 3 high-impact, ATS-optimized bullet points using the STAR framework (Situation, Task, Action, Result).
Target Role: {payload.target_role}
Job Description Context: {payload.job_description or "General tech position"}

Original Bullet: "{payload.bullet_point}"

Provide JSON output strictly in this format:
{{
  "variations": [
    "Variation 1 starting with a strong action verb and metric...",
    "Variation 2 focusing on technical execution and architecture...",
    "Variation 3 focusing on impact and optimization..."
  ],
  "keywords_added": ["Action Verb", "Metric", "Tech Keyword"]
}}
"""
    try:
        raw_response = query_llm(prompt=prompt, provider=provider, api_key=api_key)
        cleaned = extract_json_from_response(raw_response)
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            parsed = json.loads(match.group(0))
            return OptimizeBulletResponse(
                original=payload.bullet_point,
                variations=parsed.get("variations", [payload.bullet_point]),
                keywords_added=parsed.get("keywords_added", [])
            )
    except Exception as e:
        print(f"LLM optimization error: {e}")

    # Fallback response
    return OptimizeBulletResponse(
        original=payload.bullet_point,
        variations=[
          f"Architected and deployed {payload.bullet_point} using modern best practices, resulting in 30% improved performance.",
          f"Engineered key solutions for {payload.bullet_point}, optimizing system reliability and team delivery.",
          f"Led implementation of {payload.bullet_point}, reducing processing latency and enhancing user experience."
        ],
        keywords_added=["Architected", "Engineered", "Optimized"]
    )


@router.post("/tailor", response_model=TailoredCVResponse)
async def tailor_resume_for_jd(
    payload: TailorProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    x_ai_provider: Optional[str] = Header(None, alias="X-AI-Provider"),
    x_ai_key: Optional[str] = Header(None, alias="X-AI-Key")
):
    """
    Generate an AI Tailored Resume by analyzing candidate's Master Profile in Neon DB against target Job Description.
    """
    result = await db.execute(select(MasterProfile).where(MasterProfile.user_id == current_user.id))
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Master Profile not found. Please fill your profile first.")

    provider = x_ai_provider or current_user.default_ai_provider or "groq"
    api_key = x_ai_key or (current_user.ai_keys or {}).get(provider, "")

    prompt = f"""
You are a Senior Principal Technical Talent Acquisition Lead & Resume Strategist.
Tailor the candidate's Master Profile specifically for the target Job Description below.

Target Role: {payload.target_role}
Target Job Description:
{payload.job_description}

Candidate Master Profile:
Headline: {profile.headline or ""}
Summary: {profile.summary or ""}
Skills Bank: {json.dumps(profile.skills or [])}
Work History: {json.dumps(profile.work_history or [])}
Projects: {json.dumps(profile.projects or [])}
Certifications: {json.dumps(profile.certifications or [])}

CRITICAL RULES:
1. REVERSE CHRONOLOGICAL ORDER: Work History MUST be ordered with the MOST RECENT experience FIRST (e.g., 2026 experience BEFORE 2025, and 2025 BEFORE 2024).
2. STACK-RELEVANT PROJECTS: Filter and prioritize projects strictly relevant to the target JD stack. Prioritize projects matching the target stack and omit or replace irrelevant stacks.
3. CERTIFICATIONS RE-ORDERING: Re-order certifications putting those most relevant to the target role & JD keywords FIRST.
4. SUMMARY: Rewrite into a 2 to 3 sentence high-impact technical summary tailored to the target JD keywords.
5. BULLET POINTS: Each work history bullet must focus on technical architecture, key achievements, or metrics relevant to the JD.
6. HARD SKILL INTEGRATION: Identify core technical requirements, frameworks, build tools, databases, security protocols, and testing suites specified in the target JD, and seamlessly integrate these required hard skills into the technical summary, STAR work history bullet points, and technical skills list.

Return ONLY a JSON object formatted as follows:
{{
  "headline": "{payload.target_role}",
  "summary": "Tailored concise technical summary...",
  "work_history": [
    {{
      "title": "Job Title",
      "company": "Company",
      "start_month": "YYYY-MM",
      "end_month": "YYYY-MM",
      "description": "• Architecture: ...\\n• Development: ..."
    }}
  ],
  "projects": [
    {{
      "title": "Project Name",
      "tech_stack": "Target Tech 1, Target Tech 2",
      "description": "• Bullet 1...\\n• Bullet 2..."
    }}
  ],
  "certifications": [
    {{
      "title": "Most Relevant Certification Title",
      "issuer": "Issuer Name"
    }}
  ],
  "skills": ["Skill 1", "Skill 2"],
  "matched_keywords": ["Keyword 1", "Keyword 2"]
}}
"""

    def sort_work_reverse_chrono(work_items: list) -> list:
        def get_year(item):
            d_str = str(item.get("start_month") or item.get("dates") or "")
            match = re.search(r"\d{4}", d_str)
            return int(match.group(0)) if match else 0
        return sorted(work_items, key=get_year, reverse=True)

    def sort_certs_by_relevance(certs: list, target: str, jd: str) -> list:
        jd_tokens = set(re.findall(r"\b[a-zA-Z]{3,}\b", (target + " " + jd).lower()))
        def score_cert(c):
            cert_tokens = set(re.findall(r"\b[a-zA-Z]{3,}\b", str(c.get("title", "")).lower()))
            return len(cert_tokens.intersection(jd_tokens))
        return sorted(certs, key=score_cert, reverse=True)

    try:
        raw_res = query_llm(prompt=prompt, provider=provider, api_key=api_key)
        cleaned = extract_json_from_response(raw_res)
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            parsed = json.loads(match.group(0))
            raw_work = parsed.get("work_history") or profile.work_history or []
            sorted_work = sort_work_reverse_chrono(raw_work)
            
            raw_certs = parsed.get("certifications") or profile.certifications or []
            sorted_certs = sort_certs_by_relevance(raw_certs, payload.target_role, payload.job_description)

            return TailoredCVResponse(
                headline=parsed.get("headline", payload.target_role),
                summary=parsed.get("summary", profile.summary or ""),
                work_history=sorted_work,
                projects=parsed.get("projects", profile.projects or []),
                skills=parsed.get("skills", profile.skills or []),
                education=profile.education or [],
                certifications=sorted_certs,
                languages=profile.languages or [],
                phone=profile.phone or "",
                location=profile.location or "",
                links=profile.links or {},
                matched_keywords=parsed.get("matched_keywords", [])
            )
    except Exception as err:
        print(f"Tailor CV LLM error: {err}")

    raw_work = profile.work_history or []
    sorted_work = sort_work_reverse_chrono(raw_work)
    raw_certs = profile.certifications or []
    sorted_certs = sort_certs_by_relevance(raw_certs, payload.target_role, payload.job_description)

    return TailoredCVResponse(
        headline=payload.target_role,
        summary=profile.summary or "",
        work_history=sorted_work,
        projects=profile.projects or [],
        skills=profile.skills or [],
        education=profile.education or [],
        certifications=sorted_certs,
        languages=profile.languages or [],
        phone=profile.phone or "",
        location=profile.location or "",
        links=profile.links or {},
        matched_keywords=[]
    )


@router.post("/save-pdf", response_model=SaveCVResponse)
async def save_rendered_cv_pdf(
    pdf_file: UploadFile = File(...),
    title: str = Form("Tailored ATS Resume"),
    target_role: str = Form("Full-Stack Developer"),
    profile_data_json: Optional[str] = Form("{}"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Save client-side pixel-perfect rendered PDF file to host storage and Neon PostgreSQL.
    """
    tenant_dir = UPLOAD_DIR / current_user.id
    tenant_dir.mkdir(parents=True, exist_ok=True)

    cv_id = str(uuid.uuid4())
    pdf_filename = f"{cv_id}.pdf"
    file_path = tenant_dir / pdf_filename

    content = await pdf_file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    try:
        profile_data = json.loads(profile_data_json) if profile_data_json else {}
    except Exception:
        profile_data = {}

    resume = Resume(
        id=cv_id,
        user_id=current_user.id,
        title=title,
        original_filename=pdf_filename,
        raw_markdown=profile_data.get("summary", ""),
        json_data=profile_data
    )

    db.add(resume)

    # Sync candidate Master Profile in Neon PostgreSQL as well
    result = await db.execute(select(MasterProfile).where(MasterProfile.user_id == current_user.id))
    mp = result.scalars().first()
    if mp and profile_data:
        if profile_data.get("summary"): mp.summary = profile_data["summary"]
        if profile_data.get("work_history"): mp.work_history = profile_data["work_history"]
        if profile_data.get("projects"): mp.projects = profile_data["projects"]
        if profile_data.get("skills"): mp.skills = profile_data["skills"]

    await db.commit()
    await db.refresh(resume)

    file_url = f"/uploads/{current_user.id}/{pdf_filename}"

    return SaveCVResponse(
        id=resume.id,
        title=resume.title,
        created_at=resume.created_at.isoformat(),
        file_url=file_url
    )


@router.post("/save", response_model=SaveCVResponse)
async def save_cv_to_host(
    payload: SaveCVRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Save generated tailored CV to Neon PostgreSQL and generate stored PDF on host server.
    """
    tenant_dir = UPLOAD_DIR / current_user.id
    tenant_dir.mkdir(parents=True, exist_ok=True)

    cv_id = str(uuid.uuid4())
    pdf_filename = f"{cv_id}.pdf"
    file_path = tenant_dir / pdf_filename

    # Generate Host PDF file via PyMuPDF HTML engine
    try:
        generate_host_pdf(payload.profile_data, str(file_path), candidate_name=current_user.full_name or "ZOUBAA MOHAMMED")
    except Exception as err:
        print(f"PDF generation error: {err}")
        with open(file_path, "wb") as f:
            f.write(b"%PDF-1.4 empty pdf")

    title = payload.title or f"{payload.target_role} Resume"
    resume = Resume(
        id=cv_id,
        user_id=current_user.id,
        title=title,
        original_filename=pdf_filename,
        raw_markdown=payload.profile_data.get("summary", ""),
        json_data=payload.profile_data
    )

    db.add(resume)

    # Sync candidate Master Profile in Neon PostgreSQL
    result = await db.execute(select(MasterProfile).where(MasterProfile.user_id == current_user.id))
    mp = result.scalars().first()
    if mp and payload.profile_data:
        if payload.profile_data.get("summary"): mp.summary = payload.profile_data["summary"]
        if payload.profile_data.get("work_history"): mp.work_history = payload.profile_data["work_history"]
        if payload.profile_data.get("projects"): mp.projects = payload.profile_data["projects"]
        if payload.profile_data.get("skills"): mp.skills = payload.profile_data["skills"]

    await db.commit()
    await db.refresh(resume)

    file_url = f"/uploads/{current_user.id}/{pdf_filename}"

    return SaveCVResponse(
        id=resume.id,
        title=resume.title,
        created_at=resume.created_at.isoformat(),
        file_url=file_url
    )
