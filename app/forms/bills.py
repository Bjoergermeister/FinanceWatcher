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

    def __init__(self, user, *args, **kwargs):
        super(CreateBillForm, self).__init__(*args, **kwargs)

        if self.is_bound is False:
            self.fields["date"].initial = datetime.date.today()

            latest_bill = Bill.objects.filter(user=user["id"]).order_by("pk").last()
            new_bill_number = latest_bill.pk + 1 if latest_bill is not None else 1
            self.fields["name"].initial = f"Rechnung #{new_bill_number}"

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
