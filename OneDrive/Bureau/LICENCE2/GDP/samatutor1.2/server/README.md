# samatutor-proxy

Minimal Node/Express proxy to forward AI API calls securely from the frontend.

Features:
- Forwards requests to Anthropic (or another provider) using a server-side API key
- Basic validation and size limits
- CORS support (configure CORS_ORIGIN)
- Rate limiting

Quick start:
1. Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY` and `PORT`.
2. cd server && npm install
3. npm start

Notes:
- In production, restrict `CORS_ORIGIN` and add logging/monitoring.
- Consider adding authentication to limit who can hit the proxy. This project adds an optional `PROXY_KEY` env var which the proxy will require via the `x-proxy-key` header if set. **Note:** do NOT expose `PROXY_KEY` in public client code in production; prefer session-based auth or signed tokens.
- The proxy forwards the request body as JSON to Anthropic's `v1/messages` endpoint and returns the provider response as JSON.
