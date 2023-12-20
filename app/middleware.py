import requests

from django.shortcuts import redirect

class ExternalServiceAuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        authorization_cookie = request.COOKIES.get("session")

        if not authorization_cookie:
            return redirect(self.build_redirect_url(request))
        
        authentication_service_url = f"http://{request.META['AUTHENTICATION_SERVICE_HOST']}/token/verify"
        headers = { "Content-Type": "application/json" }
        data = { "token": authorization_cookie }
        response = requests.post(authentication_service_url, headers=headers, json=data)

        if response.status_code != 200:
            return redirect(self.build_redirect_url(request))            
        
        request.user = response.json()        
        response = self.get_response(request)
        return response
    

    def build_redirect_url(self, request):
        authentication_service_host = request.META['AUTHENTICATION_SERVICE_URL']
        login_url = request.META['AUTHENTICATION_SERVICE_LOGIN_URL']
        redirect_url = f"http://{authentication_service_host}/{login_url}"
        
        host = request.META['HTTP_HOST']
        next_page = f"{request.scheme}://{host}{request.META['PATH_INFO']}"
        return f"{redirect_url}?next={next_page}"