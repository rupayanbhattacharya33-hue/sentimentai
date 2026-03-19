from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import re
import time
import os

# ── Load model and vectorizer ────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(BASE_DIR, 'models', 'sentiment_model.pkl'), 'rb') as f:
    model = pickle.load(f)

with open(os.path.join(BASE_DIR, 'models', 'vectorizer.pkl'), 'rb') as f:
    vectorizer = pickle.load(f)

# ── App setup ────────────────────────────────────────────────
app = FastAPI(
    title="SentimentAI API",
    description="Real-time sentiment analysis powered by Machine Learning",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Text preprocessing ───────────────────────────────────────
STOPWORDS = {
    'i','me','my','myself','we','our','ours','ourselves','you','your',
    'yours','yourself','yourselves','he','him','his','himself','she',
    'her','hers','herself','it','its','itself','they','them','their',
    'theirs','themselves','what','which','who','whom','this','that',
    'these','those','am','is','are','was','were','be','been','being',
    'have','has','had','having','do','does','did','doing','a','an',
    'the','and','but','if','or','because','as','until','while','of',
    'at','by','for','with','about','against','between','into','through',
    'during','before','after','above','below','to','from','up','down',
    'in','out','on','off','over','under','again','further','then',
    'once','here','there','when','where','why','how','all','both',
    'each','few','more','most','other','some','such','no','nor','not',
    'only','own','same','so','than','too','very','s','t','can','will',
    'just','don','should','now','d','ll','m','o','re','ve','y','ain',
    'aren','couldn','didn','doesn','hadn','hasn','haven','isn','ma',
    'mightn','mustn','needn','shan','shouldn','wasn','weren','won','wouldn'
}

def preprocess(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    words = text.split()
    words = [w for w in words if w not in STOPWORDS and len(w) > 2]
    return ' '.join(words)

# ── Request/Response models ──────────────────────────────────
class TextRequest(BaseModel):
    text: str

class BatchRequest(BaseModel):
    texts: list[str]

# ── Routes ───────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "message": "🤖 SentimentAI API is running!",
        "version": "1.0.0",
        "endpoints": ["/predict", "/predict/batch", "/health"]
    }

@app.get("/health")
def health():
    return {"status": "OK", "model": "Logistic Regression", "accuracy": "81.5%"}

@app.post("/predict")
def predict(request: TextRequest):
    start = time.time()

    if not request.text.strip():
        return {"error": "Text cannot be empty"}

    cleaned = preprocess(request.text)
    vectorized = vectorizer.transform([cleaned])
    prediction = model.predict(vectorized)[0]
    probabilities = model.predict_proba(vectorized)[0]

    sentiment = "POSITIVE" if prediction == 1 else "NEGATIVE"
    confidence = float(probabilities[prediction])
    processing_time = round((time.time() - start) * 1000, 2)

    return {
        "text": request.text,
        "sentiment": sentiment,
        "confidence": round(confidence, 4),
        "scores": {
            "positive": round(float(probabilities[1]), 4),
            "negative": round(float(probabilities[0]), 4),
        },
        "processing_time_ms": processing_time
    }

@app.post("/predict/batch")
def predict_batch(request: BatchRequest):
    if not request.texts:
        return {"error": "Texts list cannot be empty"}

    results = []
    for text in request.texts[:10]:  # max 10 at once
        cleaned = preprocess(text)
        vectorized = vectorizer.transform([cleaned])
        prediction = model.predict(vectorized)[0]
        probabilities = model.predict_proba(vectorized)[0]
        results.append({
            "text": text[:100],
            "sentiment": "POSITIVE" if prediction == 1 else "NEGATIVE",
            "confidence": round(float(probabilities[prediction]), 4),
        })

    return {"results": results, "count": len(results)}