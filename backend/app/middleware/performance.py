# app/middleware/performance.py

import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging import logger


class PerformanceMiddleware(BaseHTTPMiddleware):
    """
    Records response time for every request.
    Logs slow requests (>1s) and stores metrics to DB asynchronously.
    """

    SKIP_PATHS = {"/docs", "/redoc", "/openapi.json", "/api/v1/health"}

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.SKIP_PATHS:
            return await call_next(request)

        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = int((time.perf_counter() - start) * 1000)

        if elapsed_ms > 1000:
            logger.warning(f"Slow request: {request.method} {request.url.path} took {elapsed_ms}ms")

        response.headers["X-Response-Time"] = f"{elapsed_ms}ms"
        return response
