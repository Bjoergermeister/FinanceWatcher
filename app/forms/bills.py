import datetime

from django import forms

from ..models.Bill import Bill


class CreateBillForm(forms.ModelForm):
    id = forms.IntegerField(required=False, widget=forms.HiddenInput())
    name = forms.CharField(label="Name")
    user = forms.UUIDField(widget=forms.HiddenInput())
    date = forms.DateField(label="Datum", widget=forms.DateInput(attrs={'type': 'date'}))
    total = forms.DecimalField(widget=forms.HiddenInput(), initial=0.0)
    description = forms.CharField(label="Beschreibung (optional)", required=False, widget=forms.Textarea(attrs={'rows': 3}))
    receipt = forms.FileField(label="Kassenzettel (optional)", required=False)
    paid = forms.BooleanField(label="Bezahlt", required=False)

    def __init__(self, *args, **kwargs):
        super(CreateBillForm, self).__init__(*args, **kwargs)

        if self.is_bound is False:
            self.fields["date"].initial = datetime.date.today()

            bill_count = Bill.objects.order_by("pk").last().pk
            self.fields["name"].initial = f"Rechnung #{bill_count + 1}"

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
