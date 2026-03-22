# NexusAI SaaS Starter — Architecture

This project provides a full-stack foundation for building AI-powered SaaS platforms.

The architecture follows a **layered service pattern** designed for scalability, maintainability, and modular development.

---

## System Overview

Frontend → API → Services → Database

┌─────────────┐
│  Next.js UI │
└──────┬──────┘
       │ HTTP / REST
┌──────▼───────────┐
│   FastAPI API    │
│  (Route Layer)   │
└──────┬───────────┘
       │
┌──────▼───────────┐
│   Services Layer │
│ Business Logic   │
└──────┬───────────┘
       │
┌──────▼───────────┐
│    CRUD Layer    │
│ Database Access  │
└──────┬───────────┘
       │
┌──────▼───────────┐
│  PostgreSQL DB   │
└──────────────────┘

backend/app

api/          → FastAPI routes
services/     → business logic
crud/         → database operations
schemas/      → Pydantic models
middleware/   → request lifecycle logic
tasks/        → background workers
core/         → configuration and security
utils/        → helper functions

Client Request
     ↓
API Route
     ↓
Service Layer
     ↓
CRUD Layer
     ↓
Database

frontend/src

components/ → UI components
hooks/      → reusable React hooks
lib/        → API utilities
pages/app/  → dashboard routes