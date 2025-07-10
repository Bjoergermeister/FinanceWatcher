from django.db.models import F, Count, Sum
from django.contrib.postgres.aggregates import ArrayAgg
from django.forms import inlineformset_factory, modelformset_factory
from django.http import HttpResponse, HttpResponseNotFound, JsonResponse
from django.shortcuts import render

from ..models.Bill import Bill
from ..models.Group import Group
from ..models.Position import Position

from ..forms.bills import CreateBillForm, EditBillForm
from ..forms.positions import CreatePositionForm, EditPositionForm

def create(request):
    if request.method == "POST":
        PositionFormSet = modelformset_factory(Position, form=CreatePositionForm, can_delete=True)
        position_formset = PositionFormSet(request.POST, prefix="position")
        bill_form = CreateBillForm(request.user, request.POST)
        
        form_is_valid = bill_form.is_valid() and position_formset.is_valid()
        if form_is_valid == False:
            data = { "bill_form": bill_form.errors, "position_formset": position_formset.errors }
            return JsonResponse(data, status=400)
        
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
        
        return JsonResponse(ids, status=200)

    initial_form_values = { "user": request.user["id"] }
    bill_form = CreateBillForm(request.user, initial=initial_form_values)

    PositionFormSet = modelformset_factory(Position, form=CreatePositionForm, extra=5, can_delete=True)
    position_formset = PositionFormSet(queryset=Position.objects.none(), prefix="position")

    group_positions = {
        None: position_formset
    }

    context = {
        'bill_form': bill_form,
        'position_formset': position_formset,
        'group_positions': group_positions
    }

    return render(request, "bills/new.html", context)

def edit(request, id):
    if request.method == "POST":
        bill = Bill.objects.get(id=id)

        PositionFormSet = inlineformset_factory(Bill, Position, EditPositionForm, exclude=[], extra=0, can_delete=True)
        position_formset = PositionFormSet(request.POST, instance=bill, prefix="position")
        bill_form = EditBillForm(request.POST, request.FILES, instance=bill)
        
        form_is_valid = bill_form.is_valid() and position_formset.is_valid()
        if form_is_valid == False:
            return JsonResponse({ "bill_form": bill_form.errors, "position_formset": position_formset.errors}, status=400)
        
        ids = {}
        bill: Bill = bill_form.save(was_file_uploaded=len(request.FILES) > 0)
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

        return JsonResponse(ids, status=200)

    bill = Bill.objects.get(id=id)
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

    context = {
        'bill_id': id,
        'bill_form': bill_form,
        'position_formset': position_formset,
        'group_positions': group_positions,
        'groups': groups,
        'group_ids': group_ids
    }

    return render(request, "bills/new.html", context)

def delete(request, id):
    # Bills can only be deleted by admins or by the user who created them
    # If the user is admin, just delete the bill
    if request.user["isAdmin"]:
        result = Bill.objects.filter(id=id).delete()
            
        if result[1]["app.Bill"] != 1:
            return HttpResponseNotFound()
        return HttpResponse(status=200)
        
    # If the user is not admin, check if he created the bill
    result = Bill.objects.filter(id=id, user=request.user["id"]).delete()
    if result[1]["app.Bill"] != 1:
        return HttpResponseNotFound()

    return HttpResponse(status=200)

def delete_position(request, bill_id, position_id):

    position = Position.objects.get(id=position_id)
    price = position.price * position.quantity

    Bill.objects.filter(id=position.bill_id).update(total=F("total") - price)

    position.delete()

    return HttpResponse(status=200)

def bills(request):
    bills = Bill.objects.filter(user=request.user["id"]).annotate(position_count=Count("positions"))
    
    positions = Position.objects.filter(bill__in=bills).select_related("group").only("bill", "group")

    bill_groups = {}
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