from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseForbidden, HttpResponseNotFound, JsonResponse
from django.shortcuts import render

from ..forms.groups import CreateGroupForm, EditGroupForm

from ..models.Group import Group

def groups(request):
    user_groups = Group.objects.filter(user=request.user["id"])

    global_groups = None
    if request.user["isAdmin"]:
        global_groups = Group.objects.filter(user=None)

    form = CreateGroupForm(user=request.user)

    context = { 
        "user_groups": user_groups, 
        "global_groups": global_groups, 
        "create_form": form,
        "is_admin": request.user["isAdmin"],
        "user_id": request.user["id"]        
    }

    return render(request, "groups/groups.html", context)

def create(request):
    if request.method != "POST":
        return HttpResponse(status=405)

    form = CreateGroupForm(request.POST, request.FILES)
    if form.is_valid() == False:
        return JsonResponse(form.errors, status=400)
        
    instance = form.save()
    return JsonResponse(instance.to_dict(), status=200)

def edit(request, id):
    group = Group.objects.get(id=id)

    form = EditGroupForm(request.POST, request.FILES, instance=group)
    if form.is_valid() == False:
        return HttpResponseBadRequest()

    form.save()

    return HttpResponse(200)

def delete(request, id):
    group = None
    try:
        group = Group.objects.get(id=id)
    except Group.DoesNotExist:
        return HttpResponseNotFound()

    if group.user != request.user["id"] and request.user["isAdmin"] == False:
        return HttpResponseForbidden()

    group.delete()
    return HttpResponse(200)
