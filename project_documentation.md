# Indian Raga Classification System - Project Documentation

## 1. Idea Behind the Project
The Indian Raga Classification System is a **neuro-symbolic pipeline** for identifying and analyzing Indian Classical Ragas. The core idea is to combine modern, deep-learning based audio classification with traditional, rule-based symbolic music theory (swaras, arohana/avarohana, pakads, and gamakas). 

By marrying neural networks with symbolic logic, the system does not just blindly classify audio. Instead, it provides cognitive, musicological reasoning—explaining *why* a particular audio clip belongs to a specific raga based on its note sequences, melodic movements, dominant notes (Vadi/Samvadi), and time of performance.

## 2. What This Is All About
This project serves as a sophisticated **AI Musicologist**. Users can upload an audio file containing Indian classical music (or vocals), and the system will:
1. Extract melodic features, including pitch contours and swara (note) sequences.
2. Identify the dominant mood (rasa) and time-of-day alignment (e.g., day vs. night).
3. Classify the raga being performed.
4. Provide a generated "narrative" explaining the structural grammar and emotional context of the performance.
5. Display visual dashboards (spectrograms, pitch contours, and swara distributions).

It is designed for students, musicologists, and classical music enthusiasts who want to study the structural components of ragas through computational analysis.

## 3. Technologies Used

### Backend (Core Processing & API)
*   **Python 3.8+**: The primary programming language for the backend.
*   **FastAPI**: Provides the high-performance REST API web server (`server.py`).
*   **Librosa**: Used heavily for audio feature extraction, pitch tracking, and spectrogram generation.
*   **PyTorch & Hugging Face Transformers**: 
    *   **CLAP Model** (`laion/clap-htsat-fused`): For high-precision neural mood and global context embedding.
    *   **Mistral-7B / LLM Integration**: Generates the human-readable, musicological explanations in multiple languages (English, Hindi, Marathi, Tamil).
*   **LangChain & ChromaDB**: Used in `rag_engine.py` for a Multimodal Retrieval-Augmented Generation (RAG) system, allowing the querying of PDFs and visual graphs related to music theory.
*   **Sentence Transformers (CLIP)**: To semantically link generated visual graphs and text.

### Frontend (User Interface)
*   **React 18 & Vite**: The core frontend framework and build tool for a fast, modern web experience.
*   **Framer Motion**: For smooth UI animations and transitions.
*   **Recharts & D3**: For rendering beautiful, interactive charts representing pitch contours and swara histograms.
*   **Wavesurfer.js**: For interactive audio playback and waveform visualization.
*   **Axios**: For making API calls to the FastAPI backend.

## 4. Technical Workflow

The workflow of the system is a pipeline combining audio processing, feature extraction, symbol mapping, and final aggregation. 

1.  **Audio Ingestion (Phase 0)**
    The user uploads an audio clip via the React frontend. The FastAPI server receives the file and initiates the `HybridRagaVision` engine. The system first locks onto the tonic (Sa) using `librosa.yin` for pitch estimation, which serves as the reference frequency for all subsequent note calculations.

2.  **Audio Chunking & Feature Extraction (Phases 1 & 2)**
    The audio is divided into manageable chunks (e.g., 20 seconds). For each chunk, the system tracks the fundamental frequency (F0) and maps the continuous pitch contour to discrete Indian classical notes (Swaras) based on the locked tonic. 

3.  **Symbolic Aggregation (Phase 3)**
    The discrete swara sequences from all chunks are aggregated. The engine calculates the **Sa Stability Score**, identifies phrase endings (**Nyas Swaras**), and maps out the distribution of notes. It checks the melodic sequence against a local knowledge base (`raga_db.py`) to find matching "Pakads" (catchphrases) and grammatical transitions.

4.  **Neural Classification & Mood Detection (Phases 4 & 5)**
    Simultaneously, the raw audio is fed into the CLAP neural network. The neural model embeds the audio and compares it against text concepts (e.g., "Prabhat Samay early morning", "Sayankal romantic evening") to determine the overarching mood (Day/Night) and its confidence score.

5.  **Cognitive Reasoning & Visualization (Phase 6)**
    *   **Reasoning Bridge:** The extracted symbolic features (Vadi, Samvadi, identified Raga, Swaras) and neural mood are fed into an LLM (via Hugging Face API) which generates a poetic yet technically accurate explanation of the analysis.
    *   **Visual Generation:** Mel-spectrograms and analytical dashboards (confidence graphs, pitch tracks) are generated and saved as static images.
    
6.  **Response Delivery**
    The backend aggregates the detected raga, the generated narrative, the extracted metadata, and URLs to the generated visuals. It sends this JSON response back to the React frontend, which renders the data using Recharts and Framer Motion.

## 5. Music Therapy & Wellness Engine

The project features a dedicated **Therapy Engine** (`therapy_engine.py`) designed to analyze the therapeutic potential of the uploaded audio and recommend wellness applications.

### Why it was Built
This module bridges the gap between traditional musicology and modern wellness. Instead of just identifying the raga, the system provides actionable insights into how the music might affect the human mind and body. It gives users evidence-based explanations (e.g., "The slow rhythmic pulse promotes a lower heart rate") connecting musical features to emotional and physiological responses.

### How it Works and Analyzes
1. **Continuous Feature Mapping**: The engine takes the extracted musical features—such as tempo (BPM), pitch range (Hz), gamakas (slides), and note transitions—and maps them to continuous psychological scores (0 to 10) for **Calm**, **Energy**, and **Focus**. 
   - *Example*: A slower tempo (< 60 BPM) increases the Calm score, while a faster tempo (> 120 BPM) boosts the Energy score.
   - *Example*: Wide melodic ranges stimulate emotional depth, while focused ranges ensure stability.
2. **Therapeutic Recommendations**: Based on the dominant scores, it recommends specific use-cases, such as "Stress Reduction & Meditation", "Mood Elevation & Vitality", or "Cognitive Focus & Study".
3. **Raga Therapy Database**: It correlates the identified raga with known therapeutic benefits found in `RAGA_THERAPY_DB` (e.g., *Bhairav* stabilizes cortisol levels, *Yaman* stimulates oxytocin) and generates a suggested listening session plan tailored to the user.
