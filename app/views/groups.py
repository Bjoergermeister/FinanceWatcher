from django.http import HttpResponse, JsonResponse
from django.shortcuts import render

from ..forms.groups import CreateGroupForm

def create(request):
    if request.method == "POST":
        form = CreateGroupForm(request.POST, request.FILES)
        if form.is_valid() == False:
            return JsonResponse(form.errors, status=400)
        
        form.save()
        return HttpResponse(status=200)

    form = CreateGroupForm(user=request.user)
    return render(request, "groups/create.html", { "form": form })