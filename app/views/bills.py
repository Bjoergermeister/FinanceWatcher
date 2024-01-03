from django.forms import inlineformset_factory, modelformset_factory
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render

from ..models.Bill import Bill
from ..models.Position import Position

from ..forms.bills import CreateBillForm, EditBillForm
from ..forms.positions import CreatePositionForm, EditPositionForm

def create(request):
    if request.method == "POST":
        PositionFormSet = modelformset_factory(Position, form=CreatePositionForm)
        position_formset = PositionFormSet(request.POST, prefix="position")
        bill_form = CreateBillForm(request.POST)
        
        form_is_valid = bill_form.is_valid() and position_formset.is_valid()
        if form_is_valid == False:
            return JsonResponse({ "bill_form": bill_form.errors, "position_formset": position_formset.errors}, status=400)
        
        bill = bill_form.save()
        for position_form in position_formset:
            position_formset

        for position_form in position_formset.forms:
            position = position_form.save(commit=False)
            position.bill = bill
            position.save()

        return HttpResponse(status=200)

    initial_form_values = { "user": request.user["id"] }
    bill_form = CreateBillForm(initial=initial_form_values)

    PositionFormSet = modelformset_factory(Position, form=CreatePositionForm, extra=5)
    position_formset = PositionFormSet(queryset=Position.objects.none(), prefix="position")

    context = {
        'bill_form': bill_form,
        'position_formset': position_formset
    }

    return render(request, "bills/new.html", context)

def edit(request, id):
    if request.method == "POST":
        bill = Bill.objects.get(id=id)

        PositionFormSet = inlineformset_factory(Bill, Position, form=EditPositionForm)
        position_formset = PositionFormSet(request.POST, instance=bill, prefix="position")
        bill_form = EditBillForm(request.POST, instance=bill)
        
        form_is_valid = bill_form.is_valid() and position_formset.is_valid()
        if form_is_valid == False:
            return JsonResponse({ "bill_form": bill_form.errors, "position_formset": position_formset.errors}, status=400)
        
        bill = bill_form.save()
        for position_form in position_formset:
            position_formset

        for position_form in position_formset.forms:
            position = position_form.save(commit=False)
            position.bill = bill
            position.save()

        return HttpResponse(status=200)

    bill = Bill.objects.get(id=id)

    bill_form = EditBillForm(instance=bill)
    PositionFormSet = modelformset_factory(Position, form=EditPositionForm, extra=0)
    position_formset = PositionFormSet(queryset=Position.objects.filter(bill=bill), prefix="position")

    context = {
        'bill_id': id,
        'bill_form': bill_form,
        'position_formset': position_formset
    }

    return render(request, "bills/edit.html", context)