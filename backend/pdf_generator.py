from fpdf import FPDF
import os
from pathlib import Path

class RagaReportPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.accent_color = (176, 141, 72)
        self.header_color = (30, 31, 34)
        self.text_main = (0, 0, 0)
        self.text_dim = (80, 80, 80)
        self.card_border = (230, 230, 230)

    def header(self):
        self.set_font('helvetica', 'B', 15)
        self.set_text_color(*self.header_color)
        self.cell(0, 10, 'RAGA VISION - NEURAL ANALYSIS REPORT', 0, 1, 'C')
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 5, 'ENTERPRISE ACOUSTIC INTELLIGENCE ENGINE', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Confidential | Page {self.page_no()} | Raga Vision AI System', 0, 0, 'C')

def clean_text(text):
    """Sanitize text for FPDF latin-1 compatibility."""
    if not text: return ""
    if not isinstance(text, str): text = str(text)
    # Replace common non-latin1 characters that cause crashes
    replacements = {
        "\u2013": "-", # en dash
        "\u2014": "-", # em dash
        "\u2018": "'", # left single quote
        "\u2019": "'", # right single quote
        "\u201c": '"', # left double quote
        "\u201d": '"', # right double quote
        "\u2022": "*", # bullet
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    # Final fallback: encode to latin-1 and ignore failures, then decode back
    return text.encode("latin-1", "ignore").decode("latin-1")

def generate_report_pdf(data, output_path):
    pdf = RagaReportPDF()
    
    # --- PAGE 1: EXECUTIVE SUMMARY ---
    pdf.add_page()
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(176, 141, 72)
    pdf.cell(0, 12, "EXECUTIVE CLASSIFICATION SUMMARY", 0, 1)
    
    pdf.set_text_color(0, 0, 0)
    pdf.set_font('helvetica', 'B', 11)
    pdf.cell(50, 10, "Analyzed File:", 0, 0)
    pdf.set_font('helvetica', '', 11)
    pdf.cell(0, 10, data.get('filename', 'Unknown'), 0, 1)
    
    pdf.set_font('helvetica', 'B', 11)
    pdf.set_text_color(176, 141, 72)
    # Sanitize prediction: remove newlines and special dashes for FPDF
    prediction_text = clean_text(data.get('prediction', 'Unknown')).replace('\n', ' ').upper()
    pdf.cell(0, 10, prediction_text, 0, 1)
    
    pdf.set_text_color(0, 0, 0)
    pdf.set_font('helvetica', 'B', 11)
    pdf.cell(50, 10, "Neural Mood Context:", 0, 0)
    pdf.set_font('helvetica', '', 11)
    pdf.cell(0, 10, data.get('neural_mood', 'Unknown'), 0, 1)
    pdf.ln(5)

    # Dashboard Image
    img_url = data.get('image_url')
    if img_url:
        img_name = os.path.basename(img_url)
        img_path_static = os.path.join(os.path.dirname(__file__), "static", img_name)
        img_path_output = os.path.join(os.path.dirname(__file__), "output", img_name)
        img_path_root_static = os.path.join(os.path.dirname(__file__), "..", "static", img_name)
        img_path_root_output = os.path.join(os.path.dirname(__file__), "..", "output", img_name)
        
        img_path = None
        if os.path.exists(img_path_static):
            img_path = img_path_static
        elif os.path.exists(img_path_output):
            img_path = img_path_output
        elif os.path.exists(img_path_root_static):
            img_path = img_path_root_static
        elif os.path.exists(img_path_root_output):
            img_path = img_path_root_output
             
        if img_path and os.path.exists(img_path):
            pdf.set_font('helvetica', 'B', 10)
            pdf.set_text_color(128, 128, 128)
            pdf.cell(0, 8, "PITCH & SWARA NEURAL DASHBOARD", 0, 1, 'C')
            pdf.image(img_path, x=10, w=190)
            pdf.ln(5)

    # --- PAGE 2: THERAPEUTIC ANALYSIS & WELLNESS ---
    pdf.add_page()
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(176, 141, 72)
    pdf.cell(0, 10, "THERAPY & WELLNESS PROFILE", 0, 1, 'C')
    pdf.ln(3)

    therapy = data.get('therapy') or data.get('therapy_recommendation') or {}
    
    # Render Wellness Profile
    wellness = therapy.get('wellness_profile') or {}
    if wellness:
        start_y = pdf.get_y()
        pdf.set_fill_color(245, 245, 245)
        pdf.rect(10, start_y, 190, 24, 'F')
        pdf.set_xy(15, start_y + 2)
        pdf.set_font('helvetica', 'B', 10)
        pdf.set_text_color(176, 141, 72)
        pdf.cell(0, 5, "MUSIC WELLNESS PROFILE METRICS", 0, 1)
        
        pdf.set_font('helvetica', '', 9)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(60, 5, f"Calmness: {wellness.get('calmness', 0)}/10", 0, 0)
        pdf.cell(60, 5, f"Energy: {wellness.get('energy', 0)}/10", 0, 0)
        pdf.cell(60, 5, f"Focus: {wellness.get('focus', 0)}/10", 0, 1)
        
        pdf.set_x(15)
        pdf.cell(60, 5, f"Brightness: {wellness.get('brightness', 0)}/10", 0, 0)
        pdf.cell(60, 5, f"Stability: {wellness.get('stability', 0)}/10", 0, 0)
        pdf.cell(60, 5, f"Complexity: {wellness.get('complexity', 0)}/10", 0, 1)
        pdf.set_y(start_y + 24)
        pdf.ln(3)
    else:
        scores = therapy.get('therapy_scores', {})
        if scores:
            start_y = pdf.get_y()
            pdf.set_fill_color(245, 245, 245)
            pdf.rect(10, start_y, 190, 15, 'F')
            pdf.set_xy(15, start_y + 2)
            pdf.set_font('helvetica', 'B', 10)
            pdf.set_text_color(0, 0, 0)
            pdf.cell(60, 10, f"Calm Score: {scores.get('calm_score', 0)}/10", 0, 0)
            pdf.cell(60, 10, f"Energy Score: {scores.get('energy_score', 0)}/10", 0, 0)
            pdf.cell(60, 10, f"Focus Score: {scores.get('focus_score', 0)}/10", 0, 1)
            pdf.set_y(start_y + 15)
            pdf.ln(3)

    # Render Temporal Suitability
    temporal = therapy.get('temporal_suitability') or {}
    if temporal:
        start_y = pdf.get_y()
        pdf.set_fill_color(245, 245, 245)
        pdf.rect(10, start_y, 190, 16, 'F')
        pdf.set_xy(15, start_y + 2)
        pdf.set_font('helvetica', 'B', 10)
        pdf.set_text_color(176, 141, 72)
        pdf.cell(0, 5, "TEMPORAL SUITABILITY DISTRIBUTION", 0, 1)
        
        pdf.set_font('helvetica', '', 8)
        pdf.set_text_color(0, 0, 0)
        items = [f"{k.replace('_', ' ').title()}: {v}%" for k, v in temporal.items()]
        pdf.cell(0, 5, " | ".join(items), 0, 1)
        pdf.set_y(start_y + 16)
        pdf.ln(3)

    # Primary Recommendation Box
    rec = therapy.get('recommendation', {})
    start_y = pdf.get_y()
    pdf.set_draw_color(176, 141, 72)
    pdf.set_line_width(0.5)
    pdf.rect(10, start_y, 190, 30)
    pdf.set_xy(15, start_y + 2)
    pdf.set_font('helvetica', 'B', 10)
    pdf.set_text_color(176, 141, 72)
    pdf.cell(0, 5, "PRIMARY CLINICAL RECOMMENDATION:", 0, 1)
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_text_color(0, 0, 0)
    pdf.set_x(15)
    pdf.multi_cell(180, 6, clean_text(rec.get('primary', 'N/A')))
    pdf.set_y(start_y + 30)
    pdf.ln(3)

    # Session Plan & Alternatives
    y_cols_start = pdf.get_y()
    pdf.set_xy(10, y_cols_start)
    pdf.set_font('helvetica', 'B', 10)
    pdf.set_text_color(176, 141, 72)
    pdf.cell(90, 6, "SUGGESTED SESSION PLAN:", 0, 0)
    pdf.cell(0, 6, "ALTERNATIVE RECOMMENDATIONS:", 0, 1)
    
    y_content_start = pdf.get_y()
    pdf.set_font('helvetica', '', 8.5)
    pdf.set_text_color(80, 80, 80)
    
    session_plan = therapy.get('session_plan', [])
    session_text = "\n".join([f"Step {idx+1}: {step}" for idx, step in enumerate(session_plan)])
    pdf.multi_cell(90, 5, clean_text(session_text if session_plan else "None"))
    y_plan_end = pdf.get_y()
    
    pdf.set_xy(105, y_content_start)
    sec = rec.get('secondary', [])
    sec_text = "\n".join([f"- {s}" for s in sec])
    pdf.multi_cell(95, 5, clean_text(sec_text if sec else "None"))
    y_alt_end = pdf.get_y()
    
    # Position below the columns
    pdf.set_y(max(y_plan_end, y_alt_end) + 4)
    
    # Therapeutic explanation
    pdf.set_font('helvetica', 'B', 10)
    pdf.set_text_color(176, 141, 72)
    pdf.cell(0, 6, "THERAPEUTIC EXPLANATION & ACTION MECHANISM:", 0, 1)
    pdf.set_font('helvetica', '', 8.5)
    pdf.set_text_color(80, 80, 80)
    exp = therapy.get('explanation', [])
    exp_text = "\n".join([f"- {e}" for e in exp])
    pdf.multi_cell(0, 5, clean_text(exp_text if exp else "None"))
    
    # --- PAGE 3: DETAILED FEATURE ANALYSIS ---
    pdf.add_page()
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(30, 31, 34)
    pdf.cell(0, 15, "NEURAL FEATURE EXTRACTION GRID", 0, 1, 'C')
    pdf.ln(5)

    detailed = data.get('detailed_features', {})
    if detailed:
        col_w = 90
        spacing = 10
        def render_box(title, content_dict, color):
            curr_x, curr_y = pdf.get_x(), pdf.get_y()
            pdf.set_draw_color(240, 240, 240)
            pdf.rect(curr_x, curr_y, col_w, 42)
            pdf.set_xy(curr_x + 2, curr_y + 2)
            pdf.set_font('helvetica', 'B', 10)
            pdf.set_text_color(*color)
            pdf.cell(col_w - 4, 6, title.upper(), 0, 1)
            pdf.set_text_color(0, 0, 0)
            pdf.set_font('helvetica', '', 8)
            pdf.set_x(curr_x + 2)
            text = ""
            for k, v in content_dict.items():
                val = str(v)[:65] + "..." if len(str(v)) > 65 else str(v)
                text += f"{k}: {val}\n"
            pdf.multi_cell(col_w - 4, 4, text.strip())
            return curr_y + 42

        r1_y = pdf.get_y()
        render_box("Swaras", detailed.get('swaras', {}), (176, 141, 72))
        pdf.set_xy(105, r1_y)
        render_box("Arohana-Avarohana", detailed.get('arohana_avarohana', {}), (77, 184, 255))
        
        r2_y = r1_y + 48
        pdf.set_xy(10, r2_y)
        pk = detailed.get('pakad', [])
        render_box("Pakad", {"1": pk[0] if len(pk)>0 else "N/A", "2": pk[1] if len(pk)>1 else "N/A"}, (255, 71, 87))
        pdf.set_xy(105, r2_y)
        render_box("Gamakas", detailed.get('gamakas', {}), (113, 88, 226))
        
        r3_y = r2_y + 48
        pdf.set_xy(10, r3_y)
        render_box("Vadi-Samvadi", detailed.get('vadi_samvadi', {}), (251, 197, 49))
        pdf.set_xy(105, r3_y)
        render_box("Pitch Range", detailed.get('pitch_range', {}), (0, 206, 201))
        
        r4_y = r3_y + 48
        pdf.set_xy(10, r4_y)
        render_box("Note Transitions", detailed.get('transitions', {}), (232, 67, 147))
        pdf.set_xy(105, r4_y)
        render_box("Timing & Structure", {"BPM": detailed.get('tempo', {}).get('bpm'), "Structure": detailed.get('structure', 'N/A').replace('\n',' ')}, (214, 48, 49))
        
        r5_y = r4_y + 48
        pdf.set_xy(10, r5_y)
        render_box("Timbre Analytics", detailed.get('timbre', {}), (99, 110, 114))
        pdf.set_xy(105, r5_y)
        
        # Safe access for AI Confidence Reasoning
        adv = data.get('metadata', {}).get('advanced_features', {}) if data.get('metadata') else {}
        report_list = data.get('report', [])
        report_snippet = report_list[0][:45] if isinstance(report_list, list) and len(report_list) > 0 else "N/A"
        
        render_box("AI Confidence Reasoning", {
            "Sa Stability": f"{adv.get('sa_stability',0):.2f}", 
            "Nyas": ", ".join(adv.get('nyas_swaras',[])) if adv.get('nyas_swaras') else "N/A", 
            "Logic": report_snippet
        }, (0, 184, 148))

    # --- PAGE 4: NARRATIVE & LOGIC ---
    pdf.add_page()
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(176, 141, 72)
    pdf.cell(0, 15, "AI COGNITIVE REASONING", 0, 1, 'C')
    pdf.ln(5)
    pdf.set_text_color(0, 0, 0)
    pdf.set_font('helvetica', '', 11)
    pdf.multi_cell(0, 7, clean_text(data.get('narrative', 'No narrative provided.')))
    pdf.ln(10)
    
    # Spectrogram if available
    spec_url = data.get('spectrogram_url')
    if spec_url:
        spec_name = os.path.basename(spec_url)
        spec_path_static = os.path.join(os.path.dirname(__file__), "static", spec_name)
        spec_path_root_static = os.path.join(os.path.dirname(__file__), "..", "static", spec_name)
        
        spec_path = None
        if os.path.exists(spec_path_static):
            spec_path = spec_path_static
        elif os.path.exists(spec_path_root_static):
            spec_path = spec_path_root_static
            
        if spec_path and os.path.exists(spec_path):
            pdf.set_font('helvetica', 'B', 10)
            pdf.set_text_color(128, 128, 128)
            pdf.cell(0, 8, "SPECTROGRAM NEURAL RESISTANCE MAP", 0, 1, 'C')
            pdf.image(spec_path, x=10, w=190)
            pdf.ln(5)
         
    # Swara Chips section
    pdf.set_font('helvetica', 'B', 11)
    pdf.cell(0, 10, "DETECTED SWARA SPECTRUM:", 0, 1)
    pdf.set_font('helvetica', '', 10)
    swara_list = data.get('metadata', {}).get('swaras', [])
    if isinstance(swara_list, list) and len(swara_list) > 0:
        pdf.cell(0, 8, " | ".join([str(s) for s in swara_list]), 0, 1)
    else:
        pdf.cell(0, 8, "N/A", 0, 1)
    
    pdf.output(output_path)
    return output_path
