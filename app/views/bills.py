from django.forms import modelformset_factory
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render

from ..models.Position import Position

from ..forms.bills import CreateBillForm
from ..forms.positions import CreatePositionForm

def create(request):
    if request.method == "POST":
        PositionFormSet = modelformset_factory(Position, form=CreatePositionForm)
        position_formset = PositionFormSet(request.POST)
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
    position_formset = PositionFormSet(queryset=Position.objects.none())

    context = {
        'bill_form': bill_form,
        'position_formset': position_formset
    }

    return render(request, "bills/new.html", context)