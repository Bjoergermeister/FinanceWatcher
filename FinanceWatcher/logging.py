from __future__ import annotations

from contextvars import ContextVar
from typing import Dict, Optional

request_id: ContextVar[Optional[str]] = ContextVar("request_id", default=None)
user_id: ContextVar[Optional[str]] = ContextVar("user_id", default=None)

def set_request_context(
    _request_id: str,
    _user_id: Optional[str]
) -> None:
    """
    Store per-request context in ContextVars.
    This should be called once at the beginning of each request.
    """
    request_id.set(_request_id)
    user_id.set(_user_id)
    
def clear_request_context() -> None:
    """
    Clear per-request context after the request is finished.
    """
    request_id.set(None)
    user_id.set(None)
    
def get_request_context() -> Dict[str, Optional[str]]:
    """
    Retrieve the current request context as a dict.
    Suitable for attaching to log records.
    """
    return {
        "request_id": request_id.get(),
        "user_id": user_id.get(),
    }