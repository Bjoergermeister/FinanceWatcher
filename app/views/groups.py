from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.shortcuts import render

from ..forms.groups import CreateGroupForm, EditGroupForm

from ..models.Group import Group

def groups(request):
    user_groups = Group.objects.filter(user=request.user["id"])

    global_groups = None
    if request.user["isAdmin"]:
        global_groups = Group.objects.filter(user=None)

    context = { "user_groups": user_groups, "global_groups": global_groups, "isAdmin": request.user["isAdmin"] }
    return render(request, "groups/groups.html", context)

def create(request):
    if request.method == "POST":
        form = CreateGroupForm(request.POST, request.FILES)
        if form.is_valid() == False:
            return JsonResponse(form.errors, status=400)
        
        form.save()
        return HttpResponse(status=200)

    form = CreateGroupForm(user=request.user)
    return render(request, "groups/create.html", { "form": form })

def edit(request, id):
    group = Group.objects.get(id=id)

    form = EditGroupForm(request.POST, request.FILES, instance=group)
    if form.is_valid() == False:
        return HttpResponseBadRequest()

    form.save()

    return HttpResponse(200)

def delete(request, id):
    Group.objects.filter(id=id, user=request.user["id"]).delete()
    return HttpResponse(200)
