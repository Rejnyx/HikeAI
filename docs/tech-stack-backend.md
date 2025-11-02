
# Backend Technology Stack

**Part:** `backend`
**Project Type:** Node.js API Server

| Category      | Technology / Library | Version / Details | Justification                               |
|---------------|----------------------|-------------------|---------------------------------------------|
| **Runtime**   | Node.js              | >=20.0.0          | Modern JavaScript runtime for server-side.  |
| **Framework** | Express.js           | ~4.18.2           | Fast, unopinionated, minimalist web framework for Node.js. |
| **Database**  | Supabase (Postgres)  | ~2.39.0           | Provides database access, auth, and storage. |
| **AI**        | OpenAI API           | ~4.20.1           | Used for AI-powered route generation logic. |
| **Geospatial**| Turf.js              | ~6.5.0            | Advanced geospatial analysis.               |
|               | @mapbox/togeojson    | ~0.16.2           | GPX to GeoJSON conversion.                  |
| **API Client**| Axios                | ~1.6.2            | Promise-based HTTP client for calling external APIs (Mapy.cz). |
| **Security**  | Helmet               | ~7.1.0            | Secures Express apps by setting various HTTP headers. |
|               | CORS                 | ~2.8.5            | Enables Cross-Origin Resource Sharing.      |
|               | express-rate-limit   | ~8.2.1            | Basic rate-limiting middleware.             |
| **Logging**   | Morgan               | ~1.10.0           | HTTP request logger middleware.             |
| **Dev Tools** | Nodemon              | ~3.0.2            | Monitors for changes and automatically restarts the server. |
|               | Vitest               | ~4.0.6            | A blazing fast unit-test framework.         |
|               | Supertest            | ~7.1.4            | HTTP assertion library for testing Node.js servers. |
