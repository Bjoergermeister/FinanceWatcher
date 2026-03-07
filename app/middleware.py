from __future__ import annotations

import requests
import uuid

from typing import TypedDict

from django.contrib.auth import get_user_model
from django.core.handlers.wsgi import WSGIRequest
from django.http import JsonResponse, HttpResponse, HttpRequest
from django.shortcuts import redirect
from django.utils.deprecation import MiddlewareMixin

from app.enums import Http

from app.exceptions import HttpNotFoundException, HttpBadRequestException
from FinanceWatcher.logging import (
    set_request_context,
    clear_request_context
)

class UserData(TypedDict):
    id: uuid.uuid4
    name: str
    email: str
    firstName: str
    lastName: str
    createdAt: str
    isAdmin: bool

User = get_user_model()

class ExternalServiceAuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        authorization_cookie = request.COOKIES.get("session")

        if not authorization_cookie:
            return redirect(self.build_redirect_url(request))
        
        user_data = self.verify_token(request, authorization_cookie)
        if not user_data:
            return redirect(self.build_redirect_url(request))

        user, success = User.objects.get_or_create(
            id=user_data["id"],
            defaults={
                "email": user_data["email"],
                "username": user_data["name"],
                "first_name": user_data["firstName"],
                "last_name": user_data["lastName"],
                "is_superuser": user_data["isAdmin"],
                "is_staff": user_data["isAdmin"]
            }
        )
        
        request.user = user
        response = self.get_response(request)
        return response
    
    def verify_token(
        self: ExternalServiceAuthenticationMiddleware,
        request: WSGIRequest,
        token: str
    ) -> UserData | None:
        authentication_service_url = f"http://{request.META['AUTHENTICATION_SERVICE_HOST']}/token/verify"
        headers = { "Content-Type": "application/json" }
        data = { "token": token }
        response = requests.post(authentication_service_url, headers=headers, json=data)

        if response.status_code != Http.OK:
            return None

        return UserData(response.json())

    def build_redirect_url(self, request):
        authentication_service_host = request.META['AUTHENTICATION_SERVICE_URL']
        login_url = request.META['AUTHENTICATION_SERVICE_LOGIN_URL']
        redirect_url = f"http://{authentication_service_host}/{login_url}"
        
        host = request.META['HTTP_HOST']
        next_page = f"{request.scheme}://{host}{request.META['PATH_INFO']}"
        return f"{redirect_url}?next={next_page}"


class HTTPErrorHandlerMiddleware:
    """
    Middleware to handle HTTP errors and return appropriate JSON responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        if isinstance(exception, (HttpNotFoundException, HttpBadRequestException)):
            return self.handle_http_exception(exception)
        return None

    def handle_http_exception(self, exception):
        """
        Handle HTTP exceptions and return appropriate JSON responses.
        """
        if exception.as_json:
            return JsonResponse({"error": exception.message}, status=exception.status_code)
        return HttpResponse(exception.message, status=exception.status_code)
    
class RequestContextMiddleware(MiddlewareMixin):
    """
    Middleware that initialises logging context for each request.
    It generates a request_id and captures the user id
    Since this middleware runs after ExternalServiceAuthenticationMiddleware,
    we know that there is an authenticated user at this point since otherwise the request would have been redirected
    """

    def process_request(self, request: HttpRequest) -> None:
        """
        Called on each request before the view.
        Generates a request_id and stores user context.
        """
        request_id: str = str(uuid.uuid4())

        # Since the ExternalServiceAuthenticationMiddleware runs before this and redirects if no user session is present,
        # we know that we will have a user here
        user_id: str = request.user.pk
        set_request_context(request_id, user_id)
        
        # Expose request_id back to the client
        request.request_id = request_id

    def process_response(
        self,
        request: HttpRequest,
        response: HttpResponse,
    ) -> HttpResponse:
        """
        Attach request_id to the response and clear context.
        """
        request_id: str = getattr(request, "request_id", "")
        if request_id:
            response["X-Request-ID"] = request_id
        clear_request_context()
        return response
