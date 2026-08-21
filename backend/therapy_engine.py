import numpy as np
from backend.raga_db import RAGA_DB_V3

RAGA_THERAPY_DB = {
    "Bhairav": {
        "rasa": "Peace & Serenity",
        "science_note": "Early morning ragas with Komal Re and Dha are known to stabilize cortisol levels.",
        "session_plan": ["Bhairav (15m Alap)", "Nat Bhairav (20m Gat)", "Ahir Bhairav (10m Conclusion)"]
    },
    "Yaman": {
        "rasa": "Love & Devotion",
        "science_note": "Teevra Ma in Yaman creates emotional depth, stimulating oxytocin.",
        "session_plan": ["Yaman (20m Alap)", "Yaman Kalyan (20m Gat)", "Hamsadhwani (15m Conclusion)"]
    },
    "Bhairavi": {
        "rasa": "Universal Compassion",
        "science_note": "Bhairavi's flat swara structure is extremely grounding.",
        "session_plan": ["Bhairavi (30m Thumri)", "Malkauns (15m Alap)", "Bhairavi (5m Bhajan)"]
    }
}

SWARA_NAMES = ["Sa", "re", "Re", "ga", "Ga", "Ma", "Ma'", "Pa", "dha", "Dha", "ni", "Ni"]

def compute_therapy_scores(features):
    """
    Computes Calmness, Energy, Focus, Brightness, Stability, and Complexity scores 
    based on musical features. Returns 0-10 scaled scores.
    """
    if not features:
        return {
            "calm_score": 5.0, "energy_score": 5.0, "focus_score": 5.0,
            "brightness_score": 5.0, "stability_score": 5.0, "complexity_score": 5.0
        }

    metadata = features.get("metadata", {}) or {}
    detailed_features = features.get("detailed_features", {}) or {}
    
    # 1. TEMPO
    tempo = metadata.get("tempo", 80) or 80
    
    # 2. PITCH RANGE
    pitch_range_raw = metadata.get("pitch_range", [100, 250])
    pitch_range = 150
    if isinstance(pitch_range_raw, list) and len(pitch_range_raw) >= 2:
        if pitch_range_raw[0] is not None and pitch_range_raw[1] is not None:
            pitch_range = pitch_range_raw[1] - pitch_range_raw[0]
    elif isinstance(pitch_range_raw, (int, float)):
        pitch_range = pitch_range_raw
        
    # 3. GAMAKAS
    gamakas = metadata.get("gamakas", {}) or {}
    slides = gamakas.get("slides", "No")
    oscillations = gamakas.get("oscillations", 0) or 0
    avg_var = gamakas.get("avg_var", 0) or 0
    
    # 4. TRANSITIONS
    transitions = metadata.get("transitions", {}) or {}
    trans_count = len(transitions)
    
    # 5. SA STABILITY
    sa_stability = metadata.get("sa_stability", 0.1) or 0.1
    
    # 6. TIMBRE
    timbre = detailed_features.get("timbre", {}) or {}
    if not timbre:
        timbre = metadata.get("timbre", {}) or {}
    centroid = timbre.get("centroid", 1200.0) or 1200.0
    zcr = timbre.get("zcr", 0.05) or 0.05

    # --- Calmness Score ---
    calmness = 5.0
    if tempo < 70:
        calmness += 2.5
    elif tempo < 90:
        calmness += 1.0
    elif tempo > 120:
        calmness -= 2.0
        
    if avg_var < 15:
        calmness += 1.5
    elif avg_var > 40:
        calmness -= 1.5
        
    calmness += min(1.5, sa_stability * 5.0)
    
    if trans_count < 15:
        calmness += 1.0
    elif trans_count > 30:
        calmness -= 1.0
    calmness = round(max(0.0, min(10.0, calmness)), 1)

    # --- Energy Score ---
    energy = 5.0
    if tempo > 120:
        energy += 3.0
    elif tempo > 100:
        energy += 1.5
    elif tempo < 70:
        energy -= 2.0
        
    if avg_var > 30:
        energy += 2.0
    elif avg_var < 15:
        energy -= 1.5
        
    if centroid > 1400:
        energy += 1.0
    elif centroid < 1000:
        energy -= 1.0
    energy = round(max(0.0, min(10.0, energy)), 1)

    # --- Focus Score ---
    focus = 5.0
    if sa_stability > 0.15:
        focus += 2.0
    if avg_var < 20:
        focus += 1.5
        
    if 10 <= trans_count <= 25:
        focus += 1.5
    elif trans_count > 35:
        focus -= 1.5
        
    if 70 <= tempo <= 100:
        focus += 1.5
    elif tempo > 120:
        focus -= 1.5
    focus = round(max(0.0, min(10.0, focus)), 1)

    # --- Brightness Score ---
    brightness = 5.0 + ((centroid - 1200.0) / 400.0) * 2.0 + ((zcr - 0.05) / 0.05) * 1.5
    brightness = round(max(0.0, min(10.0, brightness)), 1)

    # --- Stability Score ---
    stability = 5.0
    if avg_var < 15:
        stability += 2.5
    elif avg_var > 40:
        stability -= 2.5
    stability += min(2.5, sa_stability * 8.0)
    if slides == "No":
        stability += 1.0
    stability = round(max(0.0, min(10.0, stability)), 1)

    # --- Complexity Score ---
    complexity = 5.0
    if trans_count > 30:
        complexity += 2.5
    elif trans_count < 12:
        complexity -= 2.5
    complexity += min(2.0, oscillations / 80.0)
    if slides == "Yes":
        complexity += 1.5
    complexity = round(max(0.0, min(10.0, complexity)), 1)

    return {
        "calm_score": calmness,
        "energy_score": energy,
        "focus_score": focus,
        "brightness_score": brightness,
        "stability_score": stability,
        "complexity_score": complexity
    }

def compute_temporal_suitability(neural_mood, raga_name):
    """
    Computes suitability scores (0-100%) for early morning, morning, afternoon,
    evening, night, and late night listening.
    """
    suitability = {
        "early_morning": 50,
        "morning": 50,
        "afternoon": 50,
        "evening": 50,
        "night": 50,
        "late_night": 50
    }
    
    # 1. Base on neural_mood (Day/Night)
    if neural_mood == "Day":
        suitability = {
            "early_morning": 60, "morning": 75, "afternoon": 65,
            "evening": 45, "night": 30, "late_night": 20
        }
    elif neural_mood == "Night":
        suitability = {
            "early_morning": 30, "morning": 20, "afternoon": 15,
            "evening": 70, "night": 90, "late_night": 85
        }
        
    # 2. Refine based on Raga database time
    raga_info = RAGA_DB_V3.get(raga_name, {})
    db_time = raga_info.get("time", "").lower()
    
    if db_time:
        if "dawn" in db_time or "early morning" in db_time:
            suitability["early_morning"] = max(suitability["early_morning"], 95)
            suitability["morning"] = max(suitability["morning"], 75)
            suitability["late_night"] = max(suitability["late_night"], 45)
            suitability["afternoon"] = min(suitability["afternoon"], 25)
            suitability["evening"] = min(suitability["evening"], 25)
            suitability["night"] = min(suitability["night"], 25)
        elif "morning" in db_time:
            suitability["morning"] = max(suitability["morning"], 95)
            suitability["early_morning"] = max(suitability["early_morning"], 80)
            suitability["afternoon"] = max(suitability["afternoon"], 40)
            suitability["evening"] = min(suitability["evening"], 25)
            suitability["night"] = min(suitability["night"], 25)
            suitability["late_night"] = min(suitability["late_night"], 20)
        elif "afternoon" in db_time:
            suitability["afternoon"] = max(suitability["afternoon"], 95)
            suitability["morning"] = max(suitability["morning"], 60)
            suitability["evening"] = max(suitability["evening"], 45)
            suitability["early_morning"] = min(suitability["early_morning"], 25)
            suitability["night"] = min(suitability["night"], 20)
            suitability["late_night"] = min(suitability["late_night"], 15)
        elif "evening" in db_time or "sunset" in db_time:
            suitability["evening"] = max(suitability["evening"], 95)
            suitability["night"] = max(suitability["night"], 75)
            suitability["afternoon"] = max(suitability["afternoon"], 40)
            suitability["early_morning"] = min(suitability["early_morning"], 20)
            suitability["morning"] = min(suitability["morning"], 20)
            suitability["late_night"] = max(suitability["late_night"], 35)
        elif "night" in db_time:
            suitability["night"] = max(suitability["night"], 95)
            suitability["evening"] = max(suitability["evening"], 80)
            suitability["late_night"] = max(suitability["late_night"], 75)
            suitability["morning"] = min(suitability["morning"], 20)
            suitability["afternoon"] = min(suitability["afternoon"], 15)
        elif "midnight" in db_time or "late night" in db_time:
            suitability["late_night"] = max(suitability["late_night"], 95)
            suitability["night"] = max(suitability["night"], 85)
            suitability["early_morning"] = max(suitability["early_morning"], 40)
            suitability["morning"] = min(suitability["morning"], 15)
            suitability["afternoon"] = min(suitability["afternoon"], 15)
            
    return suitability

def generate_advanced_recommendations(wellness, suitability, user_intent):
    """
    Generates compatibility scores, primary activity recommendation, 
    and alternatives based on the wellness profile, suitability, and user intent.
    """
    calmness = wellness["calmness"]
    energy = wellness["energy"]
    focus = wellness["focus"]
    brightness = wellness["brightness"]
    stability = wellness["stability"]
    complexity = wellness["complexity"]
    
    # Calculate raw activity compatibility scores (0 - 10)
    meditation_wellness = calmness * 0.5 + stability * 0.4 + (10.0 - energy) * 0.1
    meditation_time = max(suitability["early_morning"], suitability["morning"]) / 10.0
    meditation_score = meditation_wellness * 0.6 + meditation_time * 0.4
    
    relaxation_wellness = calmness * 0.6 + (10.0 - energy) * 0.3 + (10.0 - complexity) * 0.1
    relaxation_time = max(suitability["evening"], suitability["night"], suitability["late_night"]) / 10.0
    relaxation_score = relaxation_wellness * 0.6 + relaxation_time * 0.4
    
    focus_wellness = focus * 0.6 + stability * 0.3 + max(0, 5.0 - abs(complexity - 5.0)) * 2 * 0.1
    focus_time = max(suitability["morning"], suitability["afternoon"]) / 10.0
    focus_score = focus_wellness * 0.6 + focus_time * 0.4
    
    energy_wellness = energy * 0.5 + complexity * 0.3 + brightness * 0.2
    energy_time = max(suitability["morning"], suitability["afternoon"]) / 10.0
    energy_score = energy_wellness * 0.6 + energy_time * 0.4
    
    evening_wellness = calmness * 0.4 + complexity * 0.3 + (10.0 - brightness) * 0.3
    evening_time = suitability["evening"] / 10.0
    evening_score = evening_wellness * 0.6 + evening_time * 0.4
    
    morning_wellness = stability * 0.4 + energy * 0.3 + calmness * 0.3
    morning_time = suitability["morning"] / 10.0
    morning_score = morning_wellness * 0.6 + morning_time * 0.4
    
    sleep_wellness = calmness * 0.7 + (10.0 - energy) * 0.2 + (10.0 - complexity) * 0.1
    sleep_time = max(suitability["night"], suitability["late_night"]) / 10.0
    sleep_score = sleep_wellness * 0.6 + sleep_time * 0.4
    
    general_wellness = stability * 0.4 + calmness * 0.3 + focus * 0.3
    general_time = sum(suitability.values()) / 60.0
    general_score = general_wellness * 0.6 + general_time * 0.4
    
    raw_scores = {
        "Meditation": round(meditation_score * 10.0),
        "Relaxation": round(relaxation_score * 10.0),
        "Focus / Study": round(focus_score * 10.0),
        "Energy / Alertness": round(energy_score * 10.0),
        "Evening Listening": round(evening_score * 10.0),
        "Morning Listening": round(morning_score * 10.0),
        "Sleep Preparation": round(sleep_score * 10.0),
        "General Wellness": round(general_score * 10.0)
    }
    
    intent_mapping = {
        "relaxation": "Relaxation",
        "meditation": "Meditation",
        "focus / study": "Focus / Study",
        "focus": "Focus / Study",
        "study": "Focus / Study",
        "evening listening": "Evening Listening",
        "morning listening": "Morning Listening",
        "energy / alertness": "Energy / Alertness",
        "energy": "Energy / Alertness",
        "general wellness": "General Wellness",
        "sleep preparation": "Sleep Preparation",
        "sleep": "Sleep Preparation"
    }
    
    final_scores = {}
    if user_intent and user_intent.lower() in intent_mapping:
        target_key = intent_mapping[user_intent.lower()]
        for key, val in raw_scores.items():
            if key == target_key:
                final_scores[key] = min(99, round(val * 0.8 + 20.0))
            else:
                final_scores[key] = round(val * 0.9)
    else:
        final_scores = raw_scores
        
    friendly_names = {
        "Meditation": "Stress Reduction & Meditation",
        "Relaxation": "Stress Reduction & Relaxation",
        "Focus / Study": "Cognitive Focus & Study",
        "Energy / Alertness": "Mood Elevation & Vitality",
        "Evening Listening": "Evening Melodic Listening",
        "Morning Listening": "Morning Vitality & Prayer",
        "Sleep Preparation": "Deep Sleep Preparation",
        "General Wellness": "General Emotional Balance"
    }
    
    sorted_activities = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)
    primary_activity, primary_score = sorted_activities[0]
    
    durations = {
        "Meditation": "20–30 minutes",
        "Relaxation": "20–40 minutes",
        "Focus / Study": "30–45 minutes",
        "Energy / Alertness": "15–30 minutes",
        "Evening Listening": "30–45 minutes",
        "Morning Listening": "20–30 minutes",
        "Sleep Preparation": "20–30 minutes",
        "General Wellness": "30–40 minutes"
    }
    
    if energy < 4.0:
        intensity = "Low"
    elif energy <= 7.0:
        intensity = "Medium"
    else:
        intensity = "High"
        
    time_windows = {
        "early_morning": "5:00 AM – 7:00 AM",
        "morning": "7:00 AM – 11:00 AM",
        "afternoon": "12:00 PM – 4:00 PM",
        "evening": "5:00 PM – 8:00 PM",
        "night": "8:00 PM – 11:00 PM",
        "late_night": "11:00 PM – 2:00 AM"
    }
    best_temp_slot = max(suitability.items(), key=lambda x: x[1])[0]
    best_time = time_windows.get(best_temp_slot, "Flexible")
    
    primary_rec = {
        "activity": friendly_names[primary_activity],
        "score": primary_score,
        "suggested_duration": durations[primary_activity],
        "intensity": intensity,
        "best_time": best_time
    }
    
    alternatives = []
    for act, score in sorted_activities[1:4]:
        alternatives.append({
            "activity": friendly_names[act],
            "score": score
        })
        
    rec_scores_output = {friendly_names[k]: v for k, v in final_scores.items()}
    
    return primary_rec, alternatives, rec_scores_output, primary_activity

def generate_therapy_explanation(features, scores):
    """
    Generates explainable, clinically safe reasoning bullet points 
    based on the extracted audio features.
    """
    metadata = features.get("metadata", {}) or {}
    detailed_features = features.get("detailed_features", {}) or {}
    
    tempo = metadata.get("tempo", 80) or 80
    sa_stability = metadata.get("sa_stability", 0.1) or 0.1
    
    gamakas = metadata.get("gamakas", {}) or {}
    avg_var = gamakas.get("avg_var", 0) or 0
    
    timbre = detailed_features.get("timbre", {}) or {}
    if not timbre:
        timbre = metadata.get("timbre", {}) or {}
    centroid = timbre.get("centroid", 1200.0) or 1200.0
    
    complexity = scores.get("complexity_score", 5.0)

    explanations = []
    
    # 1. Tempo
    if tempo < 80:
        explanations.append(f"Low-to-moderate tempo ({tempo} BPM) supports a calmer audio profile.")
    elif tempo <= 110:
        explanations.append(f"Steady tempo ({tempo} BPM) supports cognitive engagement and focus.")
    else:
        explanations.append(f"Vibrant tempo ({tempo} BPM) projects high rhythmic energy.")
        
    # 2. Stability
    if sa_stability > 0.18:
        explanations.append(f"High tonic alignment (Sa stability of {sa_stability * 100:.0f}%) contributes to a grounded, stable listening profile.")
    elif sa_stability > 0.08:
        explanations.append(f"Balanced tonic alignment (Sa stability of {sa_stability * 100:.0f}%) supports mental balance.")
    else:
        explanations.append("Varied melodic movements contribute to a fluid, active listening character.")
        
    # 3. Brightness
    if centroid > 1350:
        explanations.append(f"Higher spectral brightness (centroid of {centroid:.0f} Hz) creates an open, bright sound character.")
    elif centroid < 1050:
        explanations.append(f"Lower spectral brightness (centroid of {centroid:.0f} Hz) produces a warmer, comforting sound character.")
    else:
        explanations.append(f"Balanced spectral brightness (centroid of {centroid:.0f} Hz) ensures a natural listening timbre.")
        
    # 4. Complexity
    if complexity > 7.0:
        explanations.append("High melodic complexity and rich note transitions stimulate active cognitive processing.")
    elif complexity < 4.0:
        explanations.append("Minimal melodic complexity and simple transitions ensure a peaceful, distraction-free environment.")
    else:
        explanations.append("Moderate melodic complexity is compatible with focused work and study sessions.")
        
    return explanations

def get_therapy_output(features, raga_name="Unknown", user_intent=None, user_preferences=None, feedback=None, neural_mood="Unknown"):
    """
    Main entry point for therapy/wellness recommendation generation.
    Returns backward-compatible structure alongside updated details.
    """
    if not features:
        return {
            "therapy_scores": {"calm_score": 5.0, "energy_score": 5.0, "focus_score": 5.0},
            "recommendation": {"primary": "General Balance", "secondary": []},
            "explanation": ["No data available"],
            "raga_metadata": None,
            "session_plan": []
        }
        
    # Phase 1: Music Wellness Profile
    scores = compute_therapy_scores(features)
    
    # Phase 2: Temporal Suitability
    temporal = compute_temporal_suitability(neural_mood, raga_name)
    
    wellness_profile = {
        "calmness": scores["calm_score"],
        "energy": scores["energy_score"],
        "focus": scores["focus_score"],
        "brightness": scores["brightness_score"],
        "stability": scores["stability_score"],
        "complexity": scores["complexity_score"]
    }
    
    # Phase 3, 4, 5, 6: Intents, Compatibility & Primary/Alternatives
    primary_rec, alternatives, rec_scores, primary_key = generate_advanced_recommendations(
        wellness_profile, temporal, user_intent
    )
    
    # Phase 7: Explainable Bullet Points
    explanation = generate_therapy_explanation(features, scores)
    
    # Retrieve DB attributes
    raga_therapy = RAGA_THERAPY_DB.get(raga_name) or {}
    raga_static = RAGA_DB_V3.get(raga_name) or {}
    
    # Session Plan
    session_plan = []
    if raga_name != "Unknown" and raga_therapy.get("session_plan"):
        session_plan = raga_therapy["session_plan"]
    else:
        if primary_key == "Meditation":
            session_plan = [f"{raga_name} (15m Alap)", "Ananta Calm (30m Gat)", "Quietude (15m Conclusion)"]
        elif primary_key == "Relaxation":
            session_plan = [f"{raga_name} (20m Alap)", "Evening Sandhya (25m Gat)", "Deep Rest (15m Conclusion)"]
        elif primary_key == "Focus / Study":
            session_plan = [f"{raga_name} (15m Alap)", "Mental Focus Gat (30m Gat)", "Focus Exit (15m Conclusion)"]
        elif primary_key == "Energy / Alertness":
            session_plan = [f"{raga_name} (10m Alap)", "Prana Energy (30m Gat)", "Vitality Outro (20m Conclusion)"]
        else:
            session_plan = [f"{raga_name} (15m Alap)", "Swaras Harmony (30m Gat)", "Equilibrium (15m Conclusion)"]

    # Backward compatible secondary recommendations (mapped from alternatives)
    sec_compatibility = [f"{alt['activity']} (Compatibility: {alt['score']}%)" for alt in alternatives]

    return {
        # Old compatible fields (protected)
        "therapy_scores": {
            "calm_score": scores["calm_score"],
            "energy_score": scores["energy_score"],
            "focus_score": scores["focus_score"]
        },
        "recommendation": {
            "primary": primary_rec["activity"],
            "secondary": sec_compatibility
        },
        "explanation": explanation,
        "raga_name": raga_name,
        "raga_metadata": {
            "rasa": raga_therapy.get("rasa") or raga_static.get("rasa") or "Universal",
            "science_note": raga_therapy.get("science_note") or "Musical resonance aids in neural synchronization.",
            "optimal_time": raga_static.get("optimal_time") or "Varies",
            "vadi": SWARA_NAMES[raga_static["vadi"]] if raga_static.get("vadi") is not None else "N/A",
            "samvadi": SWARA_NAMES[raga_static["samvadi"]] if raga_static.get("samvadi") is not None else "N/A",
        },
        "session_plan": session_plan,
        
        # New advanced architecture fields
        "wellness_profile": wellness_profile,
        "temporal_suitability": temporal,
        "recommendation_scores": rec_scores,
        "primary_recommendation": primary_rec,
        "alternatives": alternatives
    }
