# app/middleware/rate_limit.py
"""
Simple in-memory sliding-window rate limiter.
For production with multiple workers, swap the store for Redis.
"""
import time
from collections import defaultdict, deque
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

# Routes that need strict rate limiting
RATE_LIMITED_PATHS = {
    "/api/v1/auth/login":    (10, 60),   # 10 req / 60s
    "/api/v1/auth/register": (5,  60),   # 5  req / 60s
}

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._windows: dict[str, deque] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path not in RATE_LIMITED_PATHS:
            return await call_next(request)

        limit, window = RATE_LIMITED_PATHS[path]
        ip = request.client.host if request.client else "unknown"
        key = f"{ip}:{path}"
        now = time.time()

        dq = self._windows[key]
        # Drop timestamps outside the window
        while dq and dq[0] < now - window:
            dq.popleft()

        if len(dq) >= limit:
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Try again in {window} seconds.",
                headers={"Retry-After": str(window)},
            )

        dq.append(now)
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - len(dq)))
        return response
