"""
tts_server.py — Local TTS helper for FlowCraft
Supports Piper TTS (local) and gTTS (free Google TTS, needs internet)

Install:
  pip install fastapi uvicorn gtts pydub

Run:
  uvicorn tts_server:app --reload --port 5500

Endpoints:
  POST /tts    — Piper TTS (local, no internet needed)
  POST /gtts   — Google TTS (free, needs internet)
  GET  /voices — List available Piper voices
"""

import os, subprocess, tempfile
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="FlowCraft TTS Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PIPER_DEFAULT_MODEL = os.path.expanduser("~/.piper/en_US-lessac-high.onnx")
OUTPUT_DIR = "./tts_output"
os.makedirs(OUTPUT_DIR, exist_ok=True)


class TTSRequest(BaseModel):
    text: str
    model: Optional[str] = "en_US-lessac-high"
    output: Optional[str] = "speech.wav"
    speed: Optional[float] = 1.0


class GTTSRequest(BaseModel):
    text: str
    lang: Optional[str] = "en"
    slow: Optional[bool] = False
    output: Optional[str] = "speech.mp3"


@app.get("/")
def root():
    return {"service": "FlowCraft TTS Server", "version": "1.0.0"}


@app.get("/voices")
def list_voices():
    """List .onnx model files in ~/.piper/"""
    piper_dir = os.path.expanduser("~/.piper")
    voices = []
    if os.path.exists(piper_dir):
        for f in os.listdir(piper_dir):
            if f.endswith(".onnx"):
                voices.append(f.replace(".onnx", ""))
    return {"voices": voices, "piper_dir": piper_dir}


@app.post("/tts")
def piper_tts(req: TTSRequest):
    """
    Run Piper TTS locally.
    Requires piper-tts to be installed: pip install piper-tts
    Or: https://github.com/rhasspy/piper
    """
    out_path = os.path.join(OUTPUT_DIR, req.output)
    model_path = os.path.expanduser(f"~/.piper/{req.model}.onnx")

    if not os.path.exists(model_path):
        model_path = PIPER_DEFAULT_MODEL

    if not os.path.exists(model_path):
        raise HTTPException(
            status_code=500,
            detail=f"Piper model not found at {model_path}. "
                   f"Download from: https://huggingface.co/rhasspy/piper-voices"
        )

    try:
        result = subprocess.run(
            ["piper-tts", "--model", model_path, "--output_file", out_path],
            input=req.text.encode(),
            capture_output=True,
            timeout=60,
        )
        if result.returncode != 0:
            raise HTTPException(500, f"Piper failed: {result.stderr.decode()}")
    except FileNotFoundError:
        raise HTTPException(500, "piper-tts not installed. Run: pip install piper-tts")
    except subprocess.TimeoutExpired:
        raise HTTPException(500, "Piper TTS timed out")

    return FileResponse(out_path, media_type="audio/wav", filename=req.output)


@app.post("/gtts")
def google_tts(req: GTTSRequest):
    """
    Google Text-to-Speech via gTTS (free, needs internet).
    Install: pip install gtts
    """
    try:
        from gtts import gTTS
    except ImportError:
        raise HTTPException(500, "gTTS not installed. Run: pip install gtts")

    out_path = os.path.join(OUTPUT_DIR, req.output)

    try:
        tts = gTTS(text=req.text, lang=req.lang, slow=req.slow)
        tts.save(out_path)
    except Exception as e:
        raise HTTPException(500, f"gTTS failed: {str(e)}")

    return FileResponse(out_path, media_type="audio/mpeg", filename=req.output)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5500, reload=True)
