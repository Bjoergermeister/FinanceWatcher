import json

from django.core.handlers.wsgi import WSGIRequest
from django.db.models import Q
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseForbidden, HttpResponseNotFound, JsonResponse
from django.shortcuts import render

from ..forms.groups import CreateGroupForm, EditGroupForm

from ..models.Group import Group

def groups(request: WSGIRequest) -> HttpResponse:
    user_groups = Group.objects.filter(user=request.user["id"])

    global_groups = None
    if request.user["isAdmin"]:
        global_groups = Group.objects.filter(user=None)

    form = CreateGroupForm(request.user)

    context = { 
        "user_groups": user_groups, 
        "global_groups": global_groups, 
        "create_form": form,
        "is_admin": request.user["isAdmin"],
        "user_id": request.user["id"]        
    }

    return render(request, "groups/groups.html", context)

def list_all(request: WSGIRequest) -> HttpResponse:

    body = json.loads(request.body)
    already_chosen_groups = body["alreadyChosenGroups"]

    groups = Group.objects.filter(Q(user=request.user["id"]) | Q(user=None))
    if len(already_chosen_groups) > 0:
        groups = groups.exclude(id__in=already_chosen_groups)

    # We need an standard python object so that it can be JSON-serialized. 
    # Otherwise, calling values() here with all members would be unnecessary
    groups = [group.to_dict() for group in groups]

    user_groups = []
    global_groups = []
    for group in groups:
        target_group = user_groups if group["user"] is not None else global_groups
        target_group.append(group)

    result = {
        "user_groups": user_groups,
        "global_groups": global_groups
    }

    return JsonResponse(result)

def create(request: WSGIRequest) -> HttpResponse:
    if request.method != "POST":
        return HttpResponse(status=405)

    if len(request.FILES) == 0:
        return HttpResponseBadRequest()

    user_groups = Group.get_all_for_user(request.user)

    form = CreateGroupForm(request.user, request.POST,request.FILES, user_groups=user_groups)
    if form.is_valid() == False:
        return JsonResponse(form.errors, status=400)
    
    instance: Group = form.save(commit=False)
    
    # Only admins are allowed to create global groups.
    # If the user tried to create a global group but is not an administrator, send an 403 response
    if instance.user is None and request.user["isAdmin"] == False:
        return HttpResponseForbidden()
    
    icon_was_uploaded = "icon" in request.FILES
    instance.save(icon_was_uploaded)

    return JsonResponse(instance.to_dict(), status=200)

def edit(request: WSGIRequest, id: int) -> HttpResponse:
    group = None
    try:
        group = Group.objects.get(id=id)
    except Group.DoesNotExist:
        return HttpResponseNotFound(f"Eine Gruppe mit der ID {id} existiert nicht")

    user_groups = Group.get_all_for_user(request.user, exclude_id=id)

    form = EditGroupForm(request.user, request.POST, request.FILES, instance=group, user_groups=user_groups)
    if form.is_valid() == False:
        return JsonResponse(form.errors, status=400)

    instance: Group = form.save(commit=False)

    instance.save(file_was_uploaded=len(request.FILES) > 0)

    return JsonResponse(instance.to_dict(), status=200)

def delete(request: WSGIRequest, id: int) -> HttpResponse:
    group = None
    try:
        group = Group.objects.get(id=id)
    except Group.DoesNotExist:
        return HttpResponseNotFound()

    if group.user != request.user["id"] and request.user["isAdmin"] == False:
        return HttpResponseForbidden()

    group.delete()
    return HttpResponse(200)
