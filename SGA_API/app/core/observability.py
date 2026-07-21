import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request
from prometheus_client import Counter, Histogram
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings

REQUESTS = Counter("sga_http_requests_total", "Peticiones HTTP", ["method", "path", "status"])
LATENCY = Histogram("sga_http_request_duration_seconds", "Latencia HTTP", ["method", "path"])


class SecurityAndMetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        started = time.perf_counter()
        response = await call_next(request)
        route = request.scope.get("route")
        path = getattr(route, "path", request.url.path)
        REQUESTS.labels(request.method, path, response.status_code).inc()
        LATENCY.labels(request.method, path).observe(time.perf_counter() - started)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(self)"
        response.headers["Cache-Control"] = "no-store"
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


class LoginRateLimiter:
    def __init__(self) -> None:
        self.attempts: dict[str, deque[float]] = defaultdict(deque)

    def check(self, request: Request) -> None:
        now = time.monotonic()
        key = request.client.host if request.client else "unknown"
        values = self.attempts[key]
        while values and values[0] < now - 60:
            values.popleft()
        if len(values) >= get_settings().login_attempts_per_minute:
            raise HTTPException(status_code=429, detail="Demasiados intentos; espere un minuto")
        values.append(now)


login_limiter = LoginRateLimiter()
