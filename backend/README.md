# Backend

Unified backend for the Valkey hackathon project, combining two subsystems:

1. **Agentic Search** (NL + semantic search, recommendations) — lives in `src/`
2. **Visual Search** (CLIP image-similarity) — lives at the backend root (`server.js`, `seed.js`, `lib/`)

Both speak to a Valkey instance with the search module loaded.

## Prerequisites

Valkey with the search module — use the bundle image:

```bash
docker run -d --name valkey -p 6379:6379 valkey/valkey-bundle:9-alpine
```

## Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in GEMINI_API_KEY if you want LLM responses
```

## Agentic Search (default `npm start`)

```bash
npm run seed           # seed catalog into Valkey
npm start              # serves the NL/semantic search API on PORT (default 4000)
```

Endpoints live under `/api/*` (see `src/routes/` for the full list).

## Visual Search (image-similarity, separate process)

The visual search server lives at `server.js` at the backend root.
It uses CLIP embeddings (`@xenova/transformers`) + Valkey vector search.

```bash
# In a separate terminal (different PORT so it doesn't clash):
PORT=4100 node server.js
node seed.js           # one-time: embed product images into Valkey
```

API:
- `POST /api/search/image`  multipart/form-data, field `image`
- `GET  /api/debug`         index + product count

The frontend page `/search/image` calls this endpoint. Update its URL via
`REACT_APP_SEARCH_API` if you change the port.

## Notes

- Both subsystems share the same Valkey instance but use different key prefixes
  (agentic uses its own; visual search uses `product:<id>` with embeddings).
- The two are NOT integrated into a single Express app yet — you run them as
  two processes during a demo. Architecture cleanup is a follow-up.
