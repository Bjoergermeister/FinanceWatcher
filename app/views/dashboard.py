import logging

from django.core.handlers.wsgi import WSGIRequest
from django.http.response import HttpResponse
from django.shortcuts import render

logger = logging.getLogger(__name__)

def dashboard(request: WSGIRequest) -> HttpResponse:
    logger.info("Dashboard requested", extra={"test": "test"})
    return render(request, "dashboard.html")