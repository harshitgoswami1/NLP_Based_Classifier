# NLP_Based_Classifier

Cyberguard classifies cybersecurity messages as Baiting, Malware, Phishing, Pretexting, Scareware, or NOT-Malicious General Class. The project includes a FastAPI backend, a Vite frontend, the saved scikit-learn model, and a development notebook.

## Run locally

In one terminal:

```sh
cd Backend
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

In another terminal:

```sh
cd Frontend
npm install
npm run dev
```

Open the URL printed by Vite. Its development server forwards `/api` to FastAPI. API documentation is available at `http://127.0.0.1:8000/docs`.

To serve the built frontend from FastAPI on port 8000, run `npm run build` in `Frontend` before starting the backend.

## API

`POST /api/predict` with `{"text":"Your account is locked. Click here to restore access."}` returns the top category and all six model scores. These scores are model estimates, not calibrated risk probabilities. `GET /api/health` reports whether the model loaded.
