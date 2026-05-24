# Nocturne & Co. — Backend

Node + Express + ioredis service that fronts a small Valkey database with a product catalogue and a natural-language search agent. Talks JSON over `http://localhost:4000`.

## Run

```
npm install
docker run -d --name valkey -p 6379:6379 valkey/valkey-bundle:9-alpine
cp .env.example .env       # optional: drop a GEMINI_API_KEY in here
npm start
```

The server seeds Valkey on first boot. Health check:

```
curl http://localhost:4000/health
# { "status": "ok", "valkey": "up", "jsonModule": true, "gemini": false, ... }
```

If the seed file (`src/data/products.js`) changes, restart and the server detects the new product count and re-seeds automatically. To force a clean re-seed:

```
docker exec valkey valkey-cli FLUSHDB
npm start
```

To re-resolve every product's hero image without touching the catalogue:

```
npm run reseed:images
```

## Folder layout

```
backend/
  src/
    server.js                   # Express app and auto-seed bootstrap
    config.js                   # .env loader (port, valkey URL, TTLs, Gemini)
    routes/
      product.routes.js         # GET /api/categories, /api/products, /api/products/:id*
      agent.routes.js           # POST /api/agent/search, GET /api/agent/suggestions, etc.
    agent/
      orchestrator.js           # parse -> plan -> tool calls -> fuse -> explain
      nlu.js                    # Rule-based parser (intents, themes, budget, age)
      gemini.js                 # Optional Gemini fallback; soft-fails to NLU
      planner.js                # Decides which tools to call given the parse
      explainer.js              # Per-product reasons + summary + notInCatalog flag
    tools/
      search_products.js        # Structured filter search via catalog service
      semantic_search.js        # Cosine over an 8-dim toy embedding
      find_similar.js           # Same-category neighbours weighted by tags + price
      get_product_details.js
      check_availability.js
      ask_clarification.js
    services/
      catalog.service.js        # The Valkey query layer used by API and tools
      product.service.js        # Hydration + small in-process memo
      cache.service.js          # agent_cache:<hash> with TTL
      conversation.service.js   # conversation:<sid> JSON, 30-minute TTL
      preference.service.js     # user_preferences:<uid>, learned from feedback
      trending.service.js       # ZSET trending counters
      image.service.js          # loremflickr keyword -> direct CDN URL + 7d cache
      search-suggest.service.js # popular ZSET, recent LIST, terms SET
    valkey/
      client.js                 # ioredis + JSON.SET auto-detect
      keys.js                   # All key-name helpers in one place
    data/
      categories.js             # 8 Nocturne categories
      products.js               # 40 products (seed source of truth)
      product-images.js         # Per-product loremflickr query map
    scripts/
      seed.js                   # CLI seed
      reseed-images.js          # CLI image resolver
  package.json
  .env.example
```

## How requests flow

A `POST /api/agent/search` with `{ sessionId, message }` does the following:

1. Look up `conversation:<sessionId>` from Valkey (or create it). The stored context includes the last intent, last categories, last price range, recipient, and the most recent product ids.
2. Track the message in `search:popular` (ZINCRBY) and `search:recent:<sid>` (LPUSH + LTRIM 10) so suggestions get smarter.
3. Run the rule-based NLU. If `GEMINI_API_KEY` is set, also run the Gemini parser in parallel; merge any non-null fields on top of the rule-based parse.
4. The planner reads the merged parse plus prior context and emits a list of tool steps. Refine intents (`cheaper`, `more expensive`, `best`) skip semantic recall because the toy embedding cannot resolve relative price intent. Theme-driven queries (`sports`, `gaming`, `study`) strip theme keywords from the free-text so the qToken filter does not reject every product that happens not to contain the literal word.
5. Tools run sequentially with results cached per-args in `agent_cache:<sha1>` for five minutes.
6. Results are fused on `productId`, sorted by combined score, and the top six are explained.
7. The explainer surfaces `notInCatalog: true` when zero results survive. The frontend renders an honest "we do not carry this right now" panel.
8. The next conversation context is persisted under `conversation:<sessionId>` with a 30-minute TTL.

## Catalogue indexes

A small but useful set of Valkey types is used to keep filtered queries fast:

- `product:<id>` JSON document (falls back to a plain stringified payload when the JSON module is missing).
- `index:products` SET of every product id.
- `category:<slug>` SET membership by category.
- `brand:<slug>` SET membership by brand.
- `products:price` and `products:price:<slug>` ZSETs scored by price for range queries.
- `products:rating` and `products:rating:<slug>` ZSETs scored by rating.
- `index:stock` HASH of live stock counts and `index:stock:low` SET of low-stock ids.
- `trending:global:1h` and `trending:category:<slug>:1h` ZSETs incremented on view and feedback.
- `index:embeddings` HASH of 8-dim toy embeddings used by semantic_search.

The catalog service does as much narrowing as it can in Valkey before pulling documents into memory. For example, `category=fashion&maxPrice=150` uses `ZRANGEBYSCORE products:price:fashion -inf 150` and only hydrates that small id set.

## Environment

`.env.example` lists everything the server reads:

```
VALKEY_URL=redis://localhost:6379
PORT=4000
CONVERSATION_TTL=1800
AGENT_CACHE_TTL=300
GEMINI_API_KEY=               # optional
GEMINI_MODEL=gemini-1.5-flash
```

Copy it to `.env` and set the Gemini key only if you want LLM-augmented parsing. Without a key the rule-based NLU handles everything.

## License

Open source, hackathon use.
