from pathlib import Path

import joblib
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


MODEL_PATH = Path(__file__).parent / "model" / "cyberguard_model.pkl"
model = joblib.load(MODEL_PATH)
app = FastAPI(title="Cyberguard API")


class Message(BaseModel):
    text: str = Field(min_length=1, max_length=10000)


@app.get("/api/health")
def health():
    return {"status": "ready"}


@app.post("/api/predict")
def predict(message: Message):
    text = message.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Enter a message to analyze.")

    scores = model.predict_proba([text])[0]
    ranked = sorted(
        (
            {"category": str(category), "score": float(score)}
            for category, score in zip(model.classes_, scores)
        ),
        key=lambda item: item["score"],
        reverse=True,
    )
    return {"category": ranked[0]["category"], "scores": ranked}


frontend_dist = Path(__file__).parent.parent / "Frontend" / "dist"
if frontend_dist.is_dir():
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
