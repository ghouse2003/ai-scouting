import streamlit as st
import PyPDF2
import re
import importlib
import json
import os
from urllib import request, error

MODEL_CANDIDATES = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
    "gemini-1.5-flash",
]

# 1. UI SETUP - Dark Professional Theme
st.set_page_config(page_title="TalentSync AI", layout="wide")
st.markdown("""
    <style>
    .main { background-color: #0e1117; }
    .stMetric { background-color: #161b22; padding: 15px; border-radius: 10px; border: 1px solid #30363d; }
    .stExpander { background-color: #161b22; border: 1px solid #30363d; }
    </style>
""", unsafe_allow_html=True)

st.title("🤖 AI-Powered Talent Scout & Engagement Agent")

# 2. SIDEBAR - The Inputs
with st.sidebar:
    st.header("⚙️ Configuration")
    api_key = st.text_input("Gemini API Key", type="password", placeholder="Enter your API Key...")
    jd_input = st.text_area("1. Paste Job Description (JD)", height=200)
    uploaded_files = st.file_uploader("2. Upload Resumes (PDF)", accept_multiple_files=True, type=['pdf'])
    process_btn = st.button("🚀 Run Deep Analysis")

# 3. PDF EXTRACTION LOGIC
def extract_pdf_text(file):
    reader = PyPDF2.PdfReader(file)
    return " ".join([page.extract_text() for page in reader.pages if page.extract_text()])


def _extract_years_of_experience(text):
    years = [int(x) for x in re.findall(r"(\d{1,2})\+?\s*years?", text, flags=re.IGNORECASE)]
    return max(years) if years else 0


def _extract_keywords(text):
    # Keep likely skills/technologies; ignore short/common words.
    tokens = re.findall(r"[A-Za-z][A-Za-z0-9+#.]{1,}", text)
    stop_words = {
        "and", "with", "for", "the", "this", "that", "years", "year", "experience",
        "role", "resume", "candidate", "job", "description", "based", "from", "into",
        "will", "have", "has", "are", "you", "your", "our", "their", "open", "work",
    }
    cleaned = []
    for t in tokens:
        low = t.lower()
        if low in stop_words or len(low) < 2:
            continue
        cleaned.append(low)
    # Preserve order while deduplicating.
    return list(dict.fromkeys(cleaned))[:30]


def _guess_candidate_name(file_name, resume_text):
    name_match = re.search(r"\bname\s*[:\-]\s*([A-Za-z][A-Za-z\s]{1,40})", resume_text, flags=re.IGNORECASE)
    if name_match:
        return " ".join(name_match.group(1).split())
    return os.path.splitext(file_name)[0]


def build_local_fallback_analysis(jd_text, resume_text, file_name):
    jd_keywords = _extract_keywords(jd_text)
    resume_low = resume_text.lower()
    matched = [kw for kw in jd_keywords if re.search(rf"\b{re.escape(kw)}\b", resume_low)]
    missing = [kw for kw in jd_keywords if kw not in matched]

    jd_years = _extract_years_of_experience(jd_text)
    resume_years = _extract_years_of_experience(resume_text)

    keyword_score = int((len(matched) / max(1, len(jd_keywords))) * 80)
    years_bonus = 20 if (jd_years and resume_years >= jd_years) else (10 if resume_years > 0 else 0)
    match_score = min(100, keyword_score + years_bonus)

    interest_score = 65
    if re.search(r"open\s+to\s+work|immediate\s+join|actively\s+looking", resume_low):
        interest_score = 80

    strengths = matched[:3] if matched else ["General profile alignment"]
    missing_points = missing[:3] if missing else ["No critical gaps detected"]

    candidate_name = _guess_candidate_name(file_name, resume_text)
    reason = (
        f"Local fallback scoring used due to API quota; matched {len(matched)} of {max(1, len(jd_keywords))} JD keywords."
    )

    return f"""
NAME: {candidate_name}
MATCH: {match_score}
INTEREST: {interest_score}
REASON: {reason}
STRENGTHS:
- {strengths[0]}
- {strengths[1] if len(strengths) > 1 else 'Relevant background'}
- {strengths[2] if len(strengths) > 2 else 'Transferable skills'}
MISSING:
- {missing_points[0]}
- {missing_points[1] if len(missing_points) > 1 else 'No additional major gap'}
- {missing_points[2] if len(missing_points) > 2 else 'No additional major gap'}
CHAT: Thanks for reaching out. I am interested in discussing this role further.
""".strip()


def generate_gemini_content(api_key, prompt):
    try:
        genai_new = importlib.import_module("google.genai")
        client = genai_new.Client(api_key=api_key)
        for model_name in MODEL_CANDIDATES:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                if getattr(response, "text", None):
                    return response.text
            except Exception:
                continue
    except Exception:
        pass

    try:
        genai_legacy = importlib.import_module("google.generativeai")
        genai_legacy.configure(api_key=api_key)
        for model_name in MODEL_CANDIDATES:
            try:
                model = genai_legacy.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                text = getattr(response, "text", None)
                if text:
                    return text
            except Exception:
                continue
    except Exception:
        pass

    # Last-resort fallback: call Gemini REST API directly so SDK availability
    # does not block analysis when Streamlit runs in a different interpreter.
    try:
        def post_generate_content(model_name):
            endpoint = (
                "https://generativelanguage.googleapis.com/v1beta/models/"
                f"{model_name}:generateContent?key={api_key}"
            )
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ]
            }
            req = request.Request(
                endpoint,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with request.urlopen(req, timeout=60) as resp:
                body = json.loads(resp.read().decode("utf-8"))

            candidates = body.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                text = "\n".join(
                    part.get("text", "")
                    for part in parts
                    if isinstance(part, dict) and part.get("text")
                ).strip()
                if text:
                    return text

            raise RuntimeError("Gemini REST API returned no text content.")

        for model_name in MODEL_CANDIDATES:
            try:
                return post_generate_content(model_name)
            except error.HTTPError as e:
                if e.code == 404:
                    continue
                detail = e.read().decode("utf-8", errors="ignore")
                raise RuntimeError(f"Gemini API request failed: {e.code} {detail}")
            except error.URLError as e:
                raise RuntimeError(f"Network error calling Gemini API: {e.reason}")

        # If preferred names all fail with 404, dynamically discover supported models.
        list_endpoint = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
        list_req = request.Request(list_endpoint, method="GET")
        with request.urlopen(list_req, timeout=60) as resp:
            model_body = json.loads(resp.read().decode("utf-8"))

        discovered = []
        for item in model_body.get("models", []):
            methods = item.get("supportedGenerationMethods", [])
            if "generateContent" in methods:
                name = item.get("name", "")
                if name.startswith("models/"):
                    discovered.append(name.split("models/", 1)[1])

        for model_name in discovered:
            try:
                return post_generate_content(model_name)
            except error.HTTPError:
                continue

        raise RuntimeError(
            "No available Gemini model supports generateContent for this API key/project."
        )
    except error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Gemini API request failed: {e.code} {detail}")
    except error.URLError as e:
        raise RuntimeError(f"Network error calling Gemini API: {e.reason}")

    raise RuntimeError(
        "Gemini SDK not found. Install one of: `pip install google-genai` or `pip install google-generativeai`."
    )

# 4. THE BRAIN (Analysis Logic)
if process_btn:
    if not api_key or not jd_input or not uploaded_files:
        st.error("Missing Data! Please provide API Key, JD, and Resumes.")
    else:
        st.subheader("📊 Ranked Candidate Shortlist")

        for file in uploaded_files:
            with st.status(f"Scanning {file.name}...", expanded=False):
                # STEP 1: READ THE ACTUAL PDF
                resume_text = extract_pdf_text(file)
                
                # STEP 2: AI DEEP DIVE
                prompt = f"""
                Compare this JD and Resume.
                JD: {jd_input}
                Resume: {resume_text}

                Return EXACTLY in this format:
                NAME: [Name]
                MATCH: [0-100]
                INTEREST: [0-100 based on location/role fit]
                REASON: [1-sentence explanation]
                STRENGTHS: [3 bullet points]
                MISSING: [3 bullet points]
                CHAT: [A simulated outreach response from the candidate]
                """
                
                try:
                    try:
                        res = generate_gemini_content(api_key, prompt)
                    except Exception as e:
                        err_text = str(e)
                        if (
                            "429" in err_text
                            or "resource_exhausted" in err_text.lower()
                            or "quota" in err_text.lower()
                        ):
                            st.warning(
                                "Gemini quota exceeded for this API key. Using local fallback scoring for this resume."
                            )
                            res = build_local_fallback_analysis(jd_input, resume_text, file.name)
                        else:
                            raise
                    
                    # Robust Parsing Logic
                    data = {}
                    
                    def extract_field(field_name, text):
                        # Matches "FIELD_NAME: <content>" up to the next field or end of string
                        pattern = rf"{field_name}:\s*(.*?)(?=\n[A-Z]+:|$)"
                        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
                        return match.group(1).strip() if match else "N/A"
                        
                    data['NAME'] = extract_field("NAME", res)
                    
                    # Safe extraction of numbers
                    match_str = extract_field("MATCH", res)
                    match_num = int(re.search(r'\d+', match_str).group()) if re.search(r'\d+', match_str) else 0
                    
                    interest_str = extract_field("INTEREST", res)
                    interest_num = int(re.search(r'\d+', interest_str).group()) if re.search(r'\d+', interest_str) else 0
                    
                    data['REASON'] = extract_field("REASON", res)
                    data['STRENGTHS'] = extract_field("STRENGTHS", res)
                    data['MISSING'] = extract_field("MISSING", res)
                    data['CHAT'] = extract_field("CHAT", res)
                    
                    # STEP 3: DYNAMIC UI
                    with st.container(border=True):
                        col_info, col_metrics = st.columns([2, 1])
                        
                        with col_info:
                            st.subheader(f"👤 {data.get('NAME')}")
                            st.write(f"**AI Insight:** {data.get('REASON')}")
                            
                            c1, c2 = st.columns(2)
                            with c1:
                                st.success("💪 Strengths")
                                st.write(data.get('STRENGTHS'))
                            with c2:
                                st.error("❌ Missing")
                                st.write(data.get('MISSING'))
                        
                        with col_metrics:
                            final = (match_num * 0.7) + (interest_num * 0.3)
                            
                            st.metric("Match Score", f"{match_num}%")
                            st.metric("Interest Score", f"{interest_num}%")
                            st.metric("Final Rank", f"{final:.1f}%")

                        with st.expander("💬 View Engagement Log"):
                            st.markdown("### Conversation Preview")
                            candidate_name = data.get("NAME")
                            st.chat_message("assistant").write(
                                f"Hi {candidate_name}, I came across your profile and it aligns well with our current role."
                            )
                            st.chat_message("user").write(
                                data.get("CHAT") or "Thanks for reaching out. I am open to hearing more details."
                            )
                            st.chat_message("assistant").write(
                                f"Great. Your current screening scores are Match {match_num}% and Interest {interest_num}%."
                            )
                            st.chat_message("assistant").write(
                                "I can share the JD, compensation range, and interview steps. Are you available for a 15-minute call tomorrow?"
                            )
                            st.chat_message("user").write(
                                "Yes, please share the details and a couple of time slots."
                            )
                            
                except Exception as e:
                    st.error(f"Error analyzing {file.name}: {e}")