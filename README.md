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
cp .env.example .env   # fill in your PostgreSQL credentials
npm install
npm run dev
```

### Client
```bash
cd client
npm install
npm run dev
```

## Deployment
- Frontend: Render static site (build command: `npm run build`, publish dir: `dist`)
- Backend: Render web service
