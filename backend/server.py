from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import shutil
import uuid
from pathlib import Path
from backend.neural_raga_engine import HybridRagaVision
from backend.audacity_loader import load_audacity_project
from backend.pdf_generator import generate_report_pdf
from backend.feedback import save_feedback
from backend.rag_engine import RagaChatEngine


class FeedbackRequest(BaseModel):
    filename: str
    predicted_raga: str
    correct_raga: str


class ChatRequest(BaseModel):
    question: str
    filename: Optional[str] = None


class IndexPDFRequest(BaseModel):
    filename: str


# Resolve project root (one level above backend/)
BASE_DIR = Path(__file__).parent.parent

# Initialize the Hybrid Neural-Symbolic Engine
neural_engine = HybridRagaVision()

# Initialize the RAG Chatbot Engine
rag_engine = RagaChatEngine()
rag_engine.index_raga_knowledge()  # Index music theory on startup

app = FastAPI(title="Raga Vision - Hybrid Intelligence")

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
app.mount("/output", StaticFiles(directory=str(BASE_DIR / "output")), name="output")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = str(BASE_DIR / "uploads")
STATIC_DIR = str(BASE_DIR / "static")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)


@app.get("/")
def read_root():
    return {"message": "Neural Raga API is running"}


@app.post("/feedback")
def submit_feedback(request: FeedbackRequest):
    try:
        save_feedback(request.filename, request.predicted_raga, request.correct_raga)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ======================= RAG CHATBOT ENDPOINTS =======================


@app.post("/index_pdf")
def index_pdf(request: IndexPDFRequest):
    """Index a generated PDF report + images into the vector store."""
    filename = request.filename
    stem = Path(filename).stem
    pdf_path = str(BASE_DIR / "static" / f"report_{stem}.pdf")

    if not os.path.exists(pdf_path):
        raise HTTPException(
            status_code=404,
            detail=f"PDF report not found. Please download the PDF first.",
        )

    # Find related images
    image_paths = []
    for prefix in ["spec_", "dash_"]:
        img_path = str(BASE_DIR / "static" / f"{prefix}{stem}.png")
        if os.path.exists(img_path):
            image_paths.append(img_path)

    result = rag_engine.index_pdf(pdf_path, filename=stem, image_paths=image_paths)
    return result


@app.post("/chat")
def chat(request: ChatRequest):
    """Query the RAG chatbot with a question about the analysis."""
    result = rag_engine.query(request.question, filename=request.filename)
    return result


@app.get("/rag_status")
def rag_status():
    """Check RAG engine status and chunk count."""
    return {"status": "active", "total_chunks": rag_engine.get_chunk_count()}


@app.post("/classify_bulk")
def classify_bulk(files: List[UploadFile] = File(...), lang: str = "en"):
    print(f"[SERVER] Received bulk request for {len(files)} files in language {lang}")
    results = []

    for file in files:
        filename_lower = file.filename.lower()
        allowed_extensions = (".wav", ".mp3", ".m4a", ".flac", ".aup", ".ogg", ".opus")

        if not filename_lower.endswith(allowed_extensions):
            continue

        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        temp_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_extension}")

        try:
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Neural Inference - Ultra Fast Semantic-Acoustic Fusion
            res = neural_engine.analyze(
                temp_path,
                duration=8,
                original_filename=file.filename,
                file_id=file_id,
                lang=lang,
            )

            # Clean up immediately for bulk
            if os.path.exists(temp_path):
                os.remove(temp_path)

            formatted_pred = f"{res['prediction']} Raga"
            results.append(
                {
                    "filename": file.filename,
                    "prediction": formatted_pred,
                    "confidence": res["confidence"],
                    "narrative": res["narrative"],
                    "spectrogram": res.get("spectrogram"),
                    "detailed_features": res.get("detailed_features"),
                    "pitch_contour_data": res.get("pitch_contour_data", []),
                    "swara_distribution_data": res.get("swara_distribution_data", {}),
                    "image_url": res.get("image_url"),
                    "therapy_recommendation": res.get("therapy"),
                    "therapy": res.get("therapy"),
                }
            )
        except Exception as e:
            print(f"Error processing {file.filename}: {str(e)}")
            if os.path.exists(temp_path):
                os.remove(temp_path)
            results.append(
                {
                    "filename": file.filename,
                    "prediction": "Analysis Failed",
                    "confidence": 0,
                    "narrative": f"Error: {str(e)}",
                    "metadata": {"swaras": []},
                    "therapy": {
                        "recommendation": {"primary": "N/A", "secondary": []},
                        "therapy_scores": {
                            "calm_score": 0,
                            "energy_score": 0,
                            "focus_score": 0,
                        },
                        "explanation": [],
                        "session_plan": [],
                        "raga_metadata": None,
                    },
                    "report": [f"Technical Error: {str(e)}"],
                    "pitch_contour_data": [],
                    "swara_distribution_data": {},
                }
            )

    return {"results": results}


# Add Request model for PDF generation
class PDFRequest(BaseModel):
    data: Dict[str, Any]


@app.post("/download_pdf")
async def download_pdf(request: PDFRequest):
    try:
        data = request.data
        filename = data.get("filename", "report")
        stem = Path(filename).stem
        # Use BASE_DIR to ensure we point to the correct static folder
        pdf_path = BASE_DIR / "static" / f"report_{stem}.pdf"

        generate_report_pdf(data, str(pdf_path))

        return FileResponse(
            str(pdf_path),
            media_type="application/pdf",
            filename=f"RagaVision_Report_{stem}.pdf",
        )
    except Exception as e:
        print(f"PDF Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")


def detect_audio_extension(filepath: str, default_ext: str) -> str:
    try:
        with open(filepath, "rb") as f:
            header = f.read(16)
        if header.startswith(b'\x1a\x45\xdf\xa3'):
            return ".webm"
        elif header.startswith(b'OggS'):
            return ".ogg"
        elif header.startswith(b'RIFF'):
            return ".wav"
        elif header.startswith(b'ID3') or header.startswith(b'\xff\xfb') or header.startswith(b'\xff\xf3') or header.startswith(b'\xff\xf2'):
            return ".mp3"
        elif b'ftyp' in header[4:12]:
            return ".m4a"
    except Exception as e:
        print(f"[FORMAT DETECT] Error: {e}")
    return default_ext


@app.post("/classify")
def classify_audio(file: UploadFile = File(...), lang: str = "en", intent: Optional[str] = None):
    print(
        f"[SERVER] Received classification request for: {file.filename} in language {lang} with intent {intent}"
    )
    filename_lower = file.filename.lower()
    allowed_extensions = (
        ".wav",
        ".mp3",
        ".m4a",
        ".flac",
        ".aup",
        ".ogg",
        ".opus",
        ".m4a",
    )

    is_aup = filename_lower.endswith(".aup")
    if not filename_lower.endswith(allowed_extensions):
        print(f"[REJECTED] Unsupported format: {file.filename}")
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format: {os.path.splitext(file.filename)[1]}",
        )

    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    temp_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_extension}")

    try:
        if is_aup:
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            try:
                result = neural_engine.analyze(
                    temp_path,
                    original_filename=file.filename,
                    file_id=file_id,
                    lang=lang,
                    intent=intent,
                )
            except Exception:
                # Fallback: check local day_ragas folder
                local_path = str(BASE_DIR / "data" / "day_ragas" / file.filename)
                if os.path.exists(local_path):
                    result = neural_engine.analyze(
                        local_path,
                        original_filename=file.filename,
                        file_id=file_id,
                        lang=lang,
                        intent=intent,
                    )
                else:
                    raise
        else:
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Detect actual format and rename if extension doesn't match
            detected_ext = detect_audio_extension(temp_path, file_extension)
            if detected_ext != file_extension:
                new_temp_path = os.path.join(UPLOAD_DIR, f"{file_id}{detected_ext}")
                os.rename(temp_path, new_temp_path)
                temp_path = new_temp_path
                print(f"[FORMAT DETECT] Mismatched extension. Renamed {file.filename} to {file_id}{detected_ext}")
                
            result = neural_engine.analyze(
                temp_path, original_filename=file.filename, file_id=file_id, lang=lang, intent=intent
            )

        formatted_pred = f"{result['prediction']} Raga"

        # Auto-generate and index PDF for RAG chatbot
        try:
            stem = Path(file.filename).stem
            pdf_path = str(BASE_DIR / "static" / f"report_{stem}.pdf")
            full_result = {
                "filename": file.filename,
                "prediction": formatted_pred,
                "neural_mood": result["neural_mood"],
                "confidence": result["confidence"],
                "metadata": result["metadata"],
                "report": result["report"],
                "narrative": result["narrative"],
                "detailed_features": result.get("detailed_features"),
                "image_url": result.get("image_url"),
                "therapy": result.get("therapy"),
            }
            generate_report_pdf(full_result, pdf_path)
            # Auto-index into RAG
            image_paths = []
            for prefix in ["spec_", "dash_"]:
                img = str(BASE_DIR / "static" / f"{prefix}{stem}.png")
                if os.path.exists(img):
                    image_paths.append(img)
            rag_engine.index_pdf(pdf_path, filename=stem, image_paths=image_paths)
        except Exception as e:
            print(f"[RAG AUTO-INDEX] Non-critical error: {e}")

        return {
            "prediction": formatted_pred,
            "neural_prediction": formatted_pred,
            "neural_confidence": result["confidence"],
            "detected_raag": formatted_pred,
            "filename": file.filename,
            "logic_score": result["logic_score"],
            "neural_mood": result["neural_mood"],
            "metadata": result["metadata"],
            "report": result["report"],
            "narrative": result["narrative"],
            "spectrogram": result["spectrogram"],
            "detailed_features": result.get("detailed_features"),
            "image_url": result.get("image_url"),
            "pitch_contour_data": result.get("pitch_contour_data", []),
            "swara_distribution_data": result.get("swara_distribution_data", {}),
            "therapy_recommendation": result.get("therapy"),
            "therapy": result.get("therapy"),
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Neural Inference Failed: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


class RecommendRequest(BaseModel):
    intent: Optional[str] = None
    query: Optional[str] = None


@app.post("/recommend")
def recommend_music(req: RecommendRequest):
    from backend.raga_db import RAGA_DB_V3
    from backend.therapy_engine import RAGA_THERAPY_DB
    import random
    
    intent = req.intent or ""
    query = req.query or ""
    
    # 1. Preset profiles mapping
    PROFILES = {
        "relax": {
            "primary": "Relaxation & Stress Relief",
            "secondary": "Evening Listening",
            "mood": "Calm & Grounding",
            "characteristics": ["Stable tonic alignment", "Low-to-moderate energy", "Soothing transitions"],
            "duration": "30–40 minutes",
            "time_slot": "Evening",
            "rasas": ["shanta", "karuna", "shringar"]
        },
        "meditate": {
            "primary": "Meditation / Stress Reduction",
            "secondary": "Morning Listening",
            "mood": "Calm & Meditative",
            "characteristics": ["Stable pitch structure", "Low energy", "Meditative melody"],
            "duration": "20–30 minutes",
            "time_slot": "Morning",
            "rasas": ["shanta", "bhakti", "karuna"]
        },
        "study": {
            "primary": "Cognitive Focus & Study",
            "secondary": "Afternoon Listening",
            "mood": "Alert yet Relaxed",
            "characteristics": ["Moderate tempo", "Moderate melodic complexity", "Stable structure"],
            "duration": "45–60 minutes",
            "time_slot": "Afternoon",
            "rasas": ["shanta", "bhakti", "shringar"]
        },
        "sleep": {
            "primary": "Deep Sleep Preparation",
            "secondary": "Night Listening",
            "mood": "Soporific & Grounding",
            "characteristics": ["Very slow tempo", "Low complexity", "High Sa stability", "Dark timbre"],
            "duration": "20–30 minutes",
            "time_slot": "Night",
            "rasas": ["shanta", "gambhir", "sorrow"]
        },
        "focus": {
            "primary": "Improve Focus",
            "secondary": "Daytime Listening",
            "mood": "Focused & Active",
            "characteristics": ["Moderate tempo", "Structured note transitions", "Clear note centers"],
            "duration": "30–45 minutes",
            "time_slot": "Afternoon",
            "rasas": ["shanta", "veera", "joy", "happiness"]
        },
        "morning": {
            "primary": "Morning Listening",
            "secondary": "Uplifting Melodies",
            "mood": "Fresh & Uplifting",
            "characteristics": ["Morning suitability", "Bright intervals", "Uplifting morning moods"],
            "duration": "20–30 minutes",
            "time_slot": "Morning",
            "rasas": ["happiness", "joy", "veera", "shanta"]
        },
        "evening": {
            "primary": "Evening Listening",
            "secondary": "Soothing Melodies",
            "mood": "Soothing & Peaceful",
            "characteristics": ["Evening suitability", "Warm note structures", "Romance & peace"],
            "duration": "30–45 minutes",
            "time_slot": "Evening",
            "rasas": ["shringar", "bhakti", "shanta"]
        },
        "explore": {
            "primary": "Explore Classical Music",
            "secondary": "Melodic Discovery",
            "mood": "Curious & Engaging",
            "characteristics": ["Rich note transitions", "Varying tempo", "Engaging melodic shape"],
            "duration": "15–30 minutes",
            "time_slot": "Midnight",
            "rasas": ["joy", "romance", "courage", "separation"]
        }
    }
    
    # 2. Match intent profile
    profile_key = intent.lower().replace("_", "").replace(" ", "")
    # Default is explore
    profile = PROFILES.get(profile_key) or PROFILES["explore"]
    
    primary_intent = profile["primary"]
    secondary_context = profile["secondary"]
    mood = profile["mood"]
    characteristics = profile["characteristics"]
    duration = profile["duration"]
    time_slot = profile["time_slot"]
    target_rasas = profile["rasas"]
    
    # 3. Custom Query Text Parsing overrides (if provided)
    if query:
        query_lower = query.lower()
        if "morning" in query_lower or "dawn" in query_lower or "early" in query_lower:
            time_slot = "Morning"
            secondary_context = "Morning Listening"
        elif "afternoon" in query_lower or "noon" in query_lower:
            time_slot = "Afternoon"
            secondary_context = "Afternoon Listening"
        elif "evening" in query_lower or "sunset" in query_lower:
            time_slot = "Evening"
            secondary_context = "Evening Listening"
        elif "night" in query_lower or "sleep" in query_lower or "bed" in query_lower or "dark" in query_lower:
            time_slot = "Night"
            secondary_context = "Night Listening"
            
        # Parse mood overrides
        if any(w in query_lower for w in ["calm", "relax", "peace", "sooth", "ground"]):
            primary_intent = "Relaxation & Stress Relief"
            mood = "Calm & Grounding"
            target_rasas = ["shanta", "karuna", "shringar"]
        elif any(w in query_lower for w in ["meditate", "prayer", "devot", "chant"]):
            primary_intent = "Meditation / Stress Reduction"
            mood = "Calm & Meditative"
            target_rasas = ["shanta", "bhakti", "karuna"]
        elif any(w in query_lower for w in ["study", "focus", "work", "concentrat", "read"]):
            primary_intent = "Cognitive Focus & Study"
            mood = "Alert yet Relaxed"
            target_rasas = ["shanta", "bhakti"]
        elif any(w in query_lower for w in ["sleep", "insomnia", "rest"]):
            primary_intent = "Deep Sleep Preparation"
            mood = "Soporific & Grounding"
            target_rasas = ["shanta", "gambhir", "sorrow"]
        elif any(w in query_lower for w in ["energy", "uplift", "happy", "power", "work out", "excit"]):
            primary_intent = "Mood Elevation & Vitality"
            mood = "Fresh & Uplifting"
            target_rasas = ["joy", "happiness", "veera"]
            
    # 4. Raga Scoring Engine
    raga_scores = []
    
    # 4a. Setup Time Period mappings
    RAGA_TIME_MAPPING = {
        "dawn": ["morning", "dawn"],
        "morning": ["morning", "dawn"],
        "afternoon": ["afternoon"],
        "evening": ["evening", "sunset"],
        "sunset": ["evening", "sunset"],
        "night": ["night", "midnight"],
        "midnight": ["night", "midnight"],
        "spring": ["morning", "afternoon", "evening", "night"],
        "rainy season": ["afternoon", "evening", "night"]
    }
    
    ADJACENT_TIMES = {
        "morning": ["dawn", "afternoon", "midnight"],
        "afternoon": ["morning", "evening"],
        "evening": ["afternoon", "sunset", "night"],
        "night": ["evening", "midnight"],
        "midnight": ["night", "dawn", "morning"],
        "dawn": ["midnight", "morning"],
        "sunset": ["evening", "night"]
    }

    for raga_name, meta in RAGA_DB_V3.items():
        # --- Time-of-Day Similarity S_time ---
        raga_time = meta.get("time", "").lower()
        target_time = time_slot.lower()
        
        # Mapped times for this raga
        mapped_times = RAGA_TIME_MAPPING.get(raga_time, [raga_time])
        
        S_time = 0.0
        if target_time in mapped_times:
            S_time = 1.0
        else:
            # Check adjacent
            is_adjacent = False
            for mt in mapped_times:
                if target_time in ADJACENT_TIMES.get(mt, []):
                    is_adjacent = True
                    break
            if is_adjacent:
                S_time = 0.5
                
        # --- Rasa/Mood Similarity S_mood ---
        raga_rasa_lower = meta.get("rasa", "").lower()
        rasa_matches = 0
        for tr in target_rasas:
            if tr in raga_rasa_lower:
                rasa_matches += 1
                
        if target_rasas:
            S_mood = rasa_matches / len(target_rasas)
        else:
            S_mood = 0.5
            
        # --- Melodic Complexity suitability S_melodic ---
        notes = meta.get("notes", [])
        num_notes = len(notes)
        is_pentatonic = num_notes <= 5
        is_heptatonic = num_notes >= 7
        
        if profile_key in ["relax", "meditate", "sleep"]:
            if is_pentatonic:
                S_melodic = 1.0
            elif is_heptatonic:
                S_melodic = 0.3
            else:
                S_melodic = 0.6
        elif profile_key in ["study", "focus", "explore"]:
            if is_heptatonic:
                S_melodic = 1.0
            elif is_pentatonic:
                S_melodic = 0.3
            else:
                S_melodic = 0.6
        else:
            S_melodic = 0.8
            
        # --- Unified Weighted Score ---
        w_time = 0.50
        w_mood = 0.35
        w_melodic = 0.15
        
        raw_match = (w_time * S_time) + (w_mood * S_mood) + (w_melodic * S_melodic)
        score = int(45 + raw_match * 50)
        
        # Deterministic tie breaker based on string length & character sum
        tie_breaker = (sum(ord(c) for c in raga_name) % 3) - 1  # -1, 0, or 1
        score = min(max(score + tie_breaker, 40), 95)
        
        raga_scores.append((raga_name, score, meta))
        
    # Sort descending
    raga_scores.sort(key=lambda x: x[1], reverse=True)
    
    # 5. Extract top recommendation
    top_raga_name, top_score, top_meta = raga_scores[0]
    
    # Compile dynamic explanations
    explanation = [
        f"Your query indicates a listening preference matching a {mood.lower()} context.",
        f"We suggest a classical raga of the {top_meta.get('time', 'day')} period, which aligns with traditional musicological Prahar time cycles.",
        f"Raga {top_raga_name.replace('_', ' ')} emphasizes emotional characteristics of {top_meta.get('rasa', 'Universal Balance')}, supporting {primary_intent.lower()}.",
        "This recommendation is wellness-oriented and is designed for general mood management."
    ]
    
    # Find session plan template
    clean_name = top_raga_name.replace("_", " ")
    therapy_info = RAGA_THERAPY_DB.get(top_raga_name) or RAGA_THERAPY_DB.get(clean_name) or {}
    session_plan = therapy_info.get("session_plan")
    if not session_plan:
        session_plan = [
            f"{clean_name} (15m Alap for slow calming progression)",
            f"{clean_name} Gat (30m structured rhythmic engagement)",
            f"{clean_name} Recessional (15m meditative integration)"
        ]
        
    # Alternatives
    alternatives = [
        {"activity": f"Raga {name.replace('_', ' ')}", "score": sc}
        for name, sc, _ in raga_scores[1:4]
    ]
    
    # Dynamic recommendation compatibility matrix
    rec_scores = {
        f"Raga {name.replace('_', ' ')}": sc
        for name, sc, _ in raga_scores[:8]
    }
    
    return {
        "intent": {
            "primary": primary_intent,
            "secondary": secondary_context
        },
        "primary_recommendation": {
            "category": f"{clean_name} ({top_meta.get('time', 'Varies')})",
            "score": top_score,
            "best_time": top_meta.get("optimal_time", "Varies"),
            "duration": duration,
            "mood": mood,
            "characteristics": characteristics
        },
        "alternatives": alternatives,
        "session_plan": session_plan,
        "recommendation_scores": rec_scores,
        "explanation": explanation
    }


if __name__ == "__main__":
    import uvicorn
    import sys
    from pathlib import Path

    port = int(os.environ.get("PORT", 8000))
    project_root = str(Path(__file__).parent.parent)
    
    # Run server with auto-reload enabled
    uvicorn.run(
        "backend.server:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        app_dir=project_root
    )
