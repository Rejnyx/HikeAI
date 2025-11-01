# Hike AI - Backend API

Backend server pro Hike AI - AI-powered hiking route generator.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL + PostGIS)
- **AI:** OpenAI GPT-5-nano
- **Maps:** Mapy.cz API + GraphHopper routing

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Zkopíruj `.env.example` do `.env` a vyplň hodnoty:

```bash
cp .env.example .env
```

Vyplň tyto hodnoty:
- `OPENAI_API_KEY` - z https://platform.openai.com/api-keys
- `SUPABASE_URL` - z Supabase dashboard
- `SUPABASE_KEY` - z Supabase dashboard

### 3. Start Development Server

```bash
npm run dev
```

Server poběží na `http://localhost:3000`

### 4. Test Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-29T...",
  "services": {
    "openai": "configured",
    "supabase": "configured"
  }
}
```

## API Endpoints

### Health Check
```
GET /health
```

### Generate Route (Coming Soon)
```
POST /api/v1/routes/generate
Content-Type: application/json

{
  "prompt": "Chci jít na Lysou horu z Ostravice",
  "constraints": {
    "maxDistance": 15,
    "difficulty": "moderate"
  }
}
```

### Get Route
```
GET /api/v1/routes/:id
```

### Search Routes
```
GET /api/v1/routes/search?near=49.5,18.4&radius=50
```

### Download GPX
```
GET /api/v1/routes/:id/gpx
```

## Project Structure

```
backend/
├── src/
│   ├── index.js           # Main server
│   ├── routes/            # API route handlers
│   │   ├── health.js
│   │   └── routes.js
│   ├── services/          # Business logic (coming soon)
│   │   ├── routeGenerator.js
│   │   ├── geocoding.js
│   │   └── supabase.js
│   ├── utils/             # Helpers (coming soon)
│   │   └── gpx.js
│   └── middleware/        # Express middleware (coming soon)
├── .env.example
├── .gitignore
└── package.json
```

## Development

### Scripts

```bash
npm run dev    # Start with auto-reload (nodemon)
npm start      # Start production server
npm test       # Run tests (coming soon)
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment (development/production) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT-5-nano |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_KEY` | Yes | Supabase anon/public key |
| `GRAPHHOPPER_API_KEY` | No | GraphHopper routing API key |

## Next Steps

1. ✅ Basic server setup
2. ⏳ Implement Supabase connection
3. ⏳ Implement route generation with AI
4. ⏳ Implement GPX export
5. ⏳ Add tests

## Troubleshooting

### Port already in use
```bash
# Change port in .env
PORT=3001
```

### Dependencies not found
```bash
npm install
```

### Environment variables not loaded
Make sure `.env` file exists and `dotenv.config()` is called in `index.js`

## Documentation

Full architecture documentation: `../docs/architecture.md`
Setup guide: `../docs/setup-guide.md`
