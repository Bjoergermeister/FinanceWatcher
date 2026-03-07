from django.core.handlers.wsgi import WSGIRequest
from django.http import HttpResponseForbidden

def bugsink(request: WSGIRequest):
    if request.user.is_superuser == False:
        return HttpResponseForbidden()
    
    raise NotImplementedError()
