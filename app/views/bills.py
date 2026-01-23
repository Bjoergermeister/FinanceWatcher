from __future__ import annotations

from typing import Dict, List

from django.db.models import Count
from django.core.handlers.wsgi import WSGIRequest
from django.forms import inlineformset_factory, modelformset_factory
from django.http import HttpResponse, HttpResponseNotFound, JsonResponse
from django.shortcuts import render
from django.views import View

from app.models.Brand import Brand
from app.models.Bill import Bill
from app.models.Country import Country
from app.models.Group import Group
from app.models.Position import Position

from ..forms.bills import CreateBillForm, EditBillForm
from ..forms.positions import CreatePositionForm, EditPositionForm
from ..enums import Http
from ..shortcuts import get_object_or_404


class CreateBillView(View):
    def get(self: CreateBillView, request: WSGIRequest) -> HttpResponse:
        initial_form_values = { "user": request.user["id"] }
        bill_form = CreateBillForm(request.user, initial=initial_form_values)

        PositionFormSet = modelformset_factory(Position, form=CreatePositionForm, extra=5, can_delete=True)
        position_formset = PositionFormSet(queryset=Position.objects.none(), prefix="position")

        group_positions = {
            None: position_formset
        }

        countries = Country.objects.all()

        context = {
            'countries': countries,
            'bill_form': bill_form,
            'position_formset': position_formset,
            'group_positions': group_positions
        }

        return render(request, "bills/new.html", context)
    
    def post(self: CreateBillView, request: WSGIRequest) -> JsonResponse:
        PositionFormSet = modelformset_factory(Position, form=CreatePositionForm, can_delete=True)
        position_formset = PositionFormSet(request.POST, prefix="position")
        bill_form = CreateBillForm(request.user, request.POST)
        
        form_is_valid = bill_form.is_valid() and position_formset.is_valid()
        if form_is_valid == False:
            data = { "bill_form": bill_form.errors, "position_formset": position_formset.errors }
            return JsonResponse(data, status=Http.BAD_REQUEST)
        
        ids = {}
        bill = bill_form.save()
        ids["bill"] = bill.pk
        
        position_ids = {}
        for position_form in position_formset.forms:
            position = position_form.save(commit=False)
            position.bill = bill
            position.save()

            position_ids[str(position_form.cleaned_data.get("uuid"))] = position.pk

        ids["positions"] = position_ids
        
        return JsonResponse(ids, status=Http.OK)


class EditBillView(View):
    def get(self: EditBillView, request: WSGIRequest, bill_id: int) -> HttpResponse:
        bill = get_object_or_404(
            Bill, pk=bill_id, user=request.user["id"],
            error_message="Die Rechnung wurde nicht gefunden"
        )
        
        bill = Bill.objects.get(pk=bill_id)
        bill_form = EditBillForm(instance=bill)

        positions = Position.objects.filter(bill=bill).select_related("group")
        group_ids = positions.exclude(group=None).distinct().values_list("group", flat=True)
        groups = { group.pk: group for group in Group.objects.filter(pk__in=group_ids)}

        PositionFormSet = modelformset_factory(Position, EditPositionForm, exclude=[], can_delete=True, extra=0, labels={"name": "", "price": "", "quantity": ""})
        position_formset = PositionFormSet(queryset=positions, prefix="position")

        group_positions = {}
        for position_form in position_formset:
            group_id = position_form.instance.group.pk if position_form.instance.group is not None else None
            if group_id not in group_positions:
                group_positions[group_id] = []

            group_positions[group_id].append(position_form)

        countries = Country.objects.all()

        context = {
            'countries': countries,
            'bill_id': bill_id,
            'bill_form': bill_form,
            'position_formset': position_formset,
            'group_positions': group_positions,
            'groups': groups,
            'group_ids': group_ids
        }

        return render(request, "bills/new.html", context)

    def post(self: EditBillView, request: WSGIRequest, bill_id: int) -> JsonResponse:
        bill = Bill.objects.get(pk=bill_id)

        PositionFormSet = inlineformset_factory(Bill, Position, EditPositionForm, exclude=[], extra=0, can_delete=True)
        position_formset = PositionFormSet(request.POST, instance=bill, prefix="position")
        bill_form = EditBillForm(request.POST, request.FILES, instance=bill)
        
        form_is_valid = bill_form.is_valid() and position_formset.is_valid()
        if form_is_valid == False:
            data = { 
                "bill_form": bill_form.errors,
                "position_formset": position_formset.errors
            }
            return JsonResponse(data, status=Http.BAD_REQUEST)
        
        ids = {}
        bill: Bill = bill_form.save(commit=False)
        bill.save(file_was_uploaded=len(request.FILES) > 0)
        ids["bill"] = bill.pk

        deleted_position_ids = [position_form.initial.get("id") for position_form in position_formset.deleted_forms]
        Position.objects.filter(pk__in=deleted_position_ids).delete()

        positions_ids = {}
        for position_form in position_formset.forms:
            if position_form.cleaned_data.get("DELETE"):
                continue

            position = position_form.save(commit=False)
            position.bill = bill
            position.save()

            positions_ids[str(position_form.cleaned_data.get("uuid"))] = position.pk

        ids["positions"] = positions_ids

        return JsonResponse(ids, status=Http.OK)
    
    def delete(self: EditBillView, request: WSGIRequest, bill_id: int) -> HttpResponse:
        # Bills can only be deleted by admins or by the user who created them
        # If the user is admin, just delete the bill
        if request.user["isAdmin"]:
            result = Bill.objects.filter(pk=bill_id).delete()
                
            if result[1]["app.Bill"] != 1:
                return HttpResponseNotFound()
            return HttpResponse(status=Http.OK)
            
        # If the user is not admin, check if he created the bill
        result = Bill.objects.filter(pk=bill_id, user=request.user["id"]).delete()
        if result[1]["app.Bill"] != 1:
            return HttpResponseNotFound()

        return HttpResponse(status=Http.OK)


def bills(request: WSGIRequest):
    bills = Bill.objects.filter(user=request.user["id"]).annotate(position_count=Count("positions"))
    
    positions = Position.objects.filter(bill__in=bills).select_related("group").only("bill", "group")

    bill_groups: Dict[Bill, List[Group]] = {}
    for position in positions:
        bill = position.bill_id
        group = position.group

        if bill not in bill_groups:
            bill_groups[bill] = []
        if group in bill_groups[bill]:
            continue

        bill_groups[bill].append(position.group)

    context = {
        "bills": bills,
        "bill_groups": bill_groups
    }

    return render(request, "bills/bills.html", context)

def preview(request: WSGIRequest, bill_id: int) -> HttpResponse:
    bill = get_object_or_404(
        Bill, pk=bill_id, user=request.user["id"],
        error_message="Die Rechnung wurde nicht gefunden.",
        json=True
    )
    bill_positions = Position.objects.filter(bill=bill).select_related("group")

    groups_positions: Dict[Group | None, List[Position]] = {}
    for position in bill_positions:
        group = position.group
        if group not in groups_positions:
            groups_positions[group] = []
        groups_positions[group].append(position)

    context = {
        'bill': bill,
        'groups_positions': groups_positions
    }

    return render(request, "bills/preview.html", context)