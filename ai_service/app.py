import os
import re
import joblib
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="Reclamations AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic models ──────────────────────────────────────────────────────────
class ComplaintRequest(BaseModel):
    description: str

class SimilarityItem(BaseModel):
    id: str
    description: str

class SimilarityRequest(BaseModel):
    source: str
    candidates: List[SimilarityItem]
    threshold: float = 0.75

class RetrainItem(BaseModel):
    description: str
    category: str

class RetrainRequest(BaseModel):
    data: List[RetrainItem]

# ── Preprocessing ────────────────────────────────────────────────────────────
def preprocess(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r"[^a-zàâäéèêëîïôöùûüçœæ0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ── Model globals ────────────────────────────────────────────────────────────
MODEL_DIR          = os.path.join(os.path.dirname(__file__), "modele")
SVC_MODEL_PATH     = os.path.join(MODEL_DIR, "sbert_svc_model.pkl")
LABEL_ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.pkl")

svc_model     = None
label_encoder = None
sbert_model   = None

@app.on_event("startup")
def load_models():
    global svc_model, label_encoder, sbert_model
    if os.path.exists(SVC_MODEL_PATH) and os.path.exists(LABEL_ENCODER_PATH):
        svc_model     = joblib.load(SVC_MODEL_PATH)
        label_encoder = joblib.load(LABEL_ENCODER_PATH)
        sbert_model = SentenceTransformer("dangvantuan/sentence-camembert-base")
    else:
        print("Warning: Models not found in 'modele' directory. Please run train.py first.")

# ── Routes ───────────────────────────────────────────────────────────────────
@app.post("/predict")
def predict_category(request: ComplaintRequest):
    if svc_model is None or sbert_model is None or label_encoder is None:
        raise HTTPException(status_code=503, detail="Models are not loaded.")

    if not request.description.strip():
        return {"category": "Autre", "probability": 0.0}

    cleaned_text = preprocess(request.description)
    embedding    = sbert_model.encode([cleaned_text])

    probs    = svc_model.predict_proba(embedding)[0]
    max_prob = float(max(probs))

    # If confidence is too low, fallback to "Autre"
    CONFIDENCE_THRESHOLD = 0.55
    if max_prob < CONFIDENCE_THRESHOLD:
        return {"category": "Autre", "probability": max_prob}

    pred_label = svc_model.predict(embedding)[0]
    category   = label_encoder.inverse_transform([pred_label])[0]

    return {"category": category, "probability": max_prob}


@app.post("/similar")
def find_similar(request: SimilarityRequest):
    if sbert_model is None:
        raise HTTPException(status_code=503, detail="SBERT model not loaded.")

    if not request.candidates:
        return {"similar": []}

    source_clean     = preprocess(request.source)
    candidates_clean = [preprocess(c.description) for c in request.candidates]

    all_texts       = [source_clean] + candidates_clean
    all_embeddings  = sbert_model.encode(all_texts)

    source_emb    = all_embeddings[0:1]
    candidate_emb = all_embeddings[1:]

    similarities = cosine_similarity(source_emb, candidate_emb)[0]

    results = []
    for i, score in enumerate(similarities):
        if float(score) >= request.threshold:
            results.append({
                "id":          request.candidates[i].id,
                "description": request.candidates[i].description,
                "score":       round(float(score) * 100, 1)
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return {"similar": results}

@app.post("/retrain")
def retrain_model(request: RetrainRequest):
    global svc_model, label_encoder
    if sbert_model is None:
        raise HTTPException(status_code=503, detail="SBERT model not loaded.")

    if not request.data or len(request.data) < 5:
        raise HTTPException(status_code=400, detail="Not enough data to retrain.")

    try:
        from sklearn.svm import SVC
        from sklearn.preprocessing import LabelEncoder
        import joblib

        texts = [preprocess(item.description) for item in request.data]
        categories = [item.category for item in request.data]

        le = LabelEncoder()
        labels = le.fit_transform(categories)

        # Ensure we have more than 1 class
        if len(set(labels)) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 categories to train.")

        embeddings = sbert_model.encode(texts)

        clf = SVC(kernel="rbf", probability=True)
        clf.fit(embeddings, labels)

        # Save to disk
        joblib.dump(le, LABEL_ENCODER_PATH)
        joblib.dump(clf, SVC_MODEL_PATH)

        # Update in memory
        label_encoder = le
        svc_model = clf

        return {"message": f"Successfully retrained model with {len(request.data)} samples."}
    except Exception as e:
        print("Retrain error:", e)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
