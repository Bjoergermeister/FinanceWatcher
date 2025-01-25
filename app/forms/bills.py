import datetime

from django import forms

from ..models.Bill import Bill


def get_initial_name():
    bill_count = Bill.objects.count()
    return f"Rechnung #{bill_count + 1}"


class CreateBillForm(forms.ModelForm):
    id = forms.IntegerField(required=False, widget=forms.HiddenInput())
    name = forms.CharField(label="Name", initial=get_initial_name)
    user = forms.UUIDField(widget=forms.HiddenInput())
    date = forms.DateField(label="Datum", initial=datetime.date.today(), widget=forms.DateInput(attrs={'type': 'date'}))
    total = forms.DecimalField(widget=forms.HiddenInput(), initial=0.0)
    description = forms.CharField(label="Beschreibung (optional)", required=False, widget=forms.Textarea(attrs={'rows': 3}))
    receipt = forms.FileField(label="Kassenzettel (optional)", required=False)
    paid = forms.BooleanField(label="Bezahlt", required=False)

    class Meta:
        model = Bill
        exclude = ["created"]


class EditBillForm(forms.ModelForm):
    id = forms.IntegerField(widget=forms.HiddenInput())
    name = forms.CharField(label="Name")
    user = forms.UUIDField(widget=forms.HiddenInput())
    date = forms.DateField(label="Datum", widget=forms.DateInput(attrs={'type': 'date'}))
    total = forms.DecimalField(widget=forms.HiddenInput())
    description = forms.CharField(label="Beschreibung (optional)", required=False, widget=forms.Textarea(attrs={'rows': 3}))
    receipt = forms.FileField(label="Kassenzettel (optional)", required=False)
    paid = forms.BooleanField(label="Bezahlt", required=False)

    class Meta:
        model = Bill
        exclude = ["created"]
