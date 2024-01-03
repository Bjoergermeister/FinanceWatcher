import datetime

from django import forms

from ..models.Bill import Bill

class CreateBillForm(forms.ModelForm):
    user = forms.UUIDField(widget=forms.HiddenInput())
    date = forms.DateField(label="Datum", initial=datetime.date.today(), widget=forms.DateInput(attrs={ 'type': 'date'}))
    total = forms.DecimalField(widget=forms.HiddenInput(), initial=0.0)
    description = forms.CharField(label="Beschreibung (optional)", required=False, widget=forms.Textarea(attrs={'rows': 3}))
    receipt = forms.FileField(label="Kassenzettel (optional)", required=False)

    class Meta:
        model = Bill
        exclude = ["created"]