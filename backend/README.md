# Agentic Search Backend

AI-powered product search agent. Node.js + Express + Valkey. Optional Gemini LLM.

See [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) for the full frontend integration guide.

## Run

```bash
npm install
docker run -d -p 6379:6379 valkey/valkey:7.2
cp .env.example .env
npm run seed
npm start
```

## Folder layout

```
backend/
├── src/
│   ├── server.js                  # Express app
│   ├── config.js                  # env loader
│   ├── routes/
│   │   └── agent.routes.js        # POST /api/agent/search, etc.
│   ├── agent/
│   │   ├── orchestrator.js        # parse → plan → tools → fuse → explain
│   │   ├── nlu.js                 # rule-based NLU
│   │   ├── gemini.js              # optional Gemini-backed parser
│   │   ├── planner.js             # decides which tools to call
│   │   └── explainer.js           # builds "why recommended" reasons
│   ├── tools/
│   │   ├── index.js               # tool registry
│   │   ├── search_products.js
│   │   ├── semantic_search.js     # cosine over 8-dim embeddings
│   │   ├── get_product_details.js
│   │   ├── check_availability.js
│   │   ├── find_similar.js
│   │   └── ask_clarification.js
│   ├── services/
│   │   ├── conversation.service.js  # JSON.SET + EXPIRE
│   │   ├── cache.service.js         # agent_cache:* with TTL
│   │   ├── preference.service.js    # long-term user prefs + learning
│   │   ├── product.service.js
│   │   └── trending.service.js      # ZSET trending
│   ├── valkey/
│   │   ├── client.js                # ioredis + JSON module auto-detect
│   │   └── keys.js                  # key naming helpers
│   ├── data/products.js             # 30-product seed
│   ├── scripts/seed.js              # `npm run seed`
│   └── models/product.js
├── package.json
├── .env.example
└── BACKEND_INTEGRATION.md
```

## Key features

- **Conversation memory**: `conversation:<sessionId>` JSON in Valkey, 30-min TTL, refreshed each turn.
- **Tool-based agent**: 6 composable tools, picked by an explicit planner.
- **Hybrid retrieval**: structured filter search + cosine-similarity semantic search, results fused.
- **Smart caching**: `agent_cache:<sha1>` per tool call, 5-min TTL.
- **Personalization**: feedback bumps `favoriteCategories` / `avoidCategories` in `user_preferences:<userId>`.
- **Trending**: ZSET `trending:global:1h` incremented per surfaced product.
- **Module auto-detect**: uses `JSON.SET` if RedisJSON / ValkeyJSON loaded, falls back to plain `SET`.
- **LLM-optional**: Gemini integration via plain `fetch` (no SDK). Falls back to rule-based parser if no key.
