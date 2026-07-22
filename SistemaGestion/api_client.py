import os

import requests
from flask import session


class ApiError(RuntimeError):
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.status_code = status_code


class SgaApi:
    def __init__(self) -> None:
        self.base_url = os.getenv("API_BASE_URL", "http://api:8000/api/v1").rstrip("/")
        self.timeout = float(os.getenv("API_TIMEOUT_SECONDS", "15"))

    def request(self, method: str, path: str, *, auth: bool = True, retry: bool = True, **kwargs):
        headers = dict(kwargs.pop("headers", {}))
        if auth and session.get("access_token"):
            headers["Authorization"] = f"Bearer {session['access_token']}"
        try:
            response = requests.request(method, f"{self.base_url}/{path.lstrip('/')}", headers=headers,
                                        timeout=self.timeout, **kwargs)
        except requests.RequestException as exc:
            raise ApiError("No fue posible conectar con la API del sistema", 503) from exc
        if response.status_code == 401 and auth and retry and session.get("refresh_token"):
            if self._refresh():
                return self.request(method, path, auth=auth, retry=False, **kwargs)
        if response.status_code >= 400:
            try:
                detail = response.json().get("detail", "Error en la API")
                if isinstance(detail, list): detail = detail[0].get("msg", "Datos no validos")
            except (ValueError, AttributeError, IndexError):
                detail = "Error en la API"
            raise ApiError(str(detail), response.status_code)
        if response.status_code == 204:
            return None
        content_type = response.headers.get("content-type", "")
        return response.content if "application/json" not in content_type else response.json()

    def _refresh(self) -> bool:
        try:
            response = requests.post(f"{self.base_url}/auth/refresh",
                                     json={"refresh_token": session["refresh_token"]}, timeout=self.timeout)
            response.raise_for_status()
            tokens = response.json()
            session["access_token"] = tokens["access_token"]
            session["refresh_token"] = tokens["refresh_token"]
            return True
        except requests.RequestException:
            session.clear()
            return False


api = SgaApi()
