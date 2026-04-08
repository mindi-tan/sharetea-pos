# Boba POS System

## Project Structure
```
/
├── client/     # React frontend (Vite)
└── server/     # Express backend
```

## Setup

### Server
```bash
cd server
# create .env with DATABASE_URL and OpenRouter settings
npm install
npm run dev
```

### Client
```bash
cd client
# create .env.local with VITE_API_URL=http://localhost:5000
npm install
npm run dev
```

### Local chatbot setup
- Put your OpenRouter key in `server/.env` as `OPENROUTER_API_KEY=...`
- Use `OPENROUTER_MODEL=openai/gpt-4o-mini` unless you want a different model
- Optional: set `OPENROUTER_APP_URL=http://localhost:5173` and `OPENROUTER_APP_NAME=Boba POS Assistant`
- Keep database credentials in `server/.env` as `DATABASE_URL=...`
- Set `VITE_API_URL=http://localhost:5000` in `client/.env.local`

## Deployment
- Frontend: Render static site (build command: `npm run build`, publish dir: `dist`)
- Backend: Render web service
