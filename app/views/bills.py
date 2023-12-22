from django.forms import modelformset_factory
from django.shortcuts import render

from ..models.Position import Position

from ..forms.bills import CreateBillForm
from ..forms.positions import CreatePositionForm

def create(request):

    bill_form = CreateBillForm()

    PositionFormSet = modelformset_factory(Position, form=CreatePositionForm, extra=5)
    position_formset = PositionFormSet()

    context = {
        'bill_form': bill_form,
        'position_formset': position_formset
    }

    return render(request, "bills/new.html", context)