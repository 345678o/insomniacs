# Visual Search Backend

Image-similarity search powered by CLIP embeddings (`@xenova/transformers`) and Valkey's vector search.

## Stack
- **Embedding model:** `Xenova/clip-vit-base-patch32` (512-dim, pulled on first run, ~150 MB)
- **Vector store:** Valkey Search module (HNSW index, cosine distance)
- **Server:** Express + multer (multipart upload)
- **Client:** [iovalkey](https://www.npmjs.com/package/iovalkey)

## Prerequisites

Valkey running with the search module — easiest path is the bundled image:

```bash
docker run -d --name valkey -p 6379:6379 valkey/valkey-bundle:9-alpine
```

## Setup

```bash
cd backend
npm install
cp .env.example .env       # optional, defaults already work
```

## One-time seed (embeds catalog + creates index)

```bash
npm run seed
```

First run downloads the CLIP model (~150 MB) into `./models/`. Subsequent runs use the cache.

## Run the server

```bash
npm start
# server listening on http://localhost:4000
```

## API

### `POST /api/search/image`
Multipart form with field `image`.

```bash
curl -F "image=@./my-photo.jpg" http://localhost:4000/api/search/image
```

Response:

```json
{
  "count": 12,
  "results": [
    { "id": "p002", "name": "Headsound", "tag": "Music", "price": "$12.00", "rating": "5", "reviews": "1.2k", "image": "https://..." }
  ]
}
```

### `GET /api/health`
Liveness check.

## How it works

```
[products.json]
      ↓ npm run seed
  CLIP embed each image (512-dim float32, L2-normalized)
      ↓
  Valkey: HSET product:<id> { ..., embedding: <bytes> }
  Valkey: FT.CREATE products_idx ... VECTOR HNSW DIM 512 COSINE
      ↓
[upload at /api/search/image]
      ↓
  CLIP embed query image
      ↓
  Valkey: FT.SEARCH products_idx "*=>[KNN 12 @embedding $vec AS score]"
      ↓
  Sorted JSON results
```

## Troubleshooting

- **`unknown command 'FT.CREATE'`** — Valkey is running but without the search module. Use the `valkey-bundle` image, not plain `valkey/valkey`.
- **First request is slow (~5s)** — model warmup. Hit `/api/health` after start to pre-warm; the server also calls `warmup()` on boot.
- **Out of memory while seeding** — switch to a smaller model (`Xenova/clip-vit-base-patch16`) or seed in smaller batches.
