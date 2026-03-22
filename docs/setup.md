
---

# `docs/setup.md`

```markdown
# NexusAI SaaS Starter — Setup Guide

This guide explains how to run the project locally.

---

# Requirements

Install the following tools:

- Docker
- Docker Compose
- Git
- Node.js (optional for frontend dev mode)
- Python 3.10+ (optional for backend dev mode)

---

# 1. Clone the Repository
git clone https://github.com/Rash54/nexusai-saas-starter.git

cd nexusai-saas-starter


---

# 2. Configure Environment Variables

Copy the example environment file.
cp .env.example .env

DATABASE_URL=
OPENAI_API_KEY=
JWT_SECRET=


---

# 3. Start the Application

Run the containers.


This will start:

- FastAPI backend
- Next.js frontend
- PostgreSQL database

---

# 4. Access the Application

Frontend
http://localhost:3000


Backend API
http://localhost:8000


API Documentation
http://localhost:8000/docs


---

# 5. Stop the Application
docker-compose down


---

# Development Mode (Optional)

Run backend without Docker:

cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload


Run frontend:

cd frontend
npm install
npm run dev


---

# Troubleshooting

If Docker containers fail to start:

docker-compose down
docker-compose build --no-cache
docker-compose up

