from django.core.handlers.wsgi import WSGIRequest
from django.http.response import HttpResponse
from django.shortcuts import render

def dashboard(request: WSGIRequest) -> HttpResponse:
    return render(request, "dashboard.html")