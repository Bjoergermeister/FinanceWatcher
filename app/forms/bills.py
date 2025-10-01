from __future__ import annotations

import uuid

import datetime

from django import forms
from django.core.files.uploadedfile import InMemoryUploadedFile

from ..models.Bill import Bill


class CreateBillForm(forms.ModelForm):
    id = forms.IntegerField(required=False, widget=forms.HiddenInput())
    name = forms.CharField(label="Name")
    user = forms.UUIDField(widget=forms.HiddenInput())
    date = forms.DateField(label="Datum", widget=forms.DateInput(attrs={'type': 'date'}))
    total = forms.DecimalField(widget=forms.HiddenInput(), initial=0.0)
    description = forms.CharField(label="Beschreibung (optional)", required=False, widget=forms.Textarea(attrs={'rows': 3}))
    receipt = forms.ImageField(label="Kassenzettel (optional)", required=False)
    paid = forms.BooleanField(label="Bezahlt", required=False)

    def __init__(self, user, *args, **kwargs):
        super(CreateBillForm, self).__init__(*args, **kwargs)

        if self.is_bound is False:
            self.fields["date"].initial = datetime.date.today()

            latest_bill = Bill.objects.filter(user=user["id"]).order_by("pk").last()
            new_bill_number = latest_bill.pk + 1 if latest_bill is not None else 1
            self.fields["name"].initial = f"Rechnung #{new_bill_number}"

        self.internal_receipt_file_name = uuid.uuid4()

    def clean(self):
        data = self.cleaned_data

        receipt: InMemoryUploadedFile = data.ge("receipt", None)
        if receipt is None:
            return data
        
        file_extension = receipt.name[receipt.name.rfind('.') + 1:]
        receipt.name = f"{self.internal_receipt_file_name}.{file_extension}"

        return data

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

    def __init__(self, *args, **kwargs):
        super(EditBillForm, self).__init__(*args, **kwargs)

        self.internal_receipt_file_name = str(uuid.uuid4())

    def clean(self):
        data = self.cleaned_data

        receipt: InMemoryUploadedFile = data.get("receipt", None)
        if receipt is not None:
            if self.instance.receipt.name is not None:
                receipt.name = self.instance.receipt.name
            else:
                file_extensions = get_file_extension(receipt.name)                
                receipt.name = f"{self.internal_receipt_file_name}.{file_extensions}"

        return data
    
    class Meta:
        model = Bill
        exclude = ["created"]

def get_file_name_without_extension(filename: str | None) -> str | None:
    if filename is None or len(filename) == 0:
        return None
    
    extension_index = filename.rfind('.')
    return filename[:extension_index] if extension_index > -1 else filename

def get_file_extension(filename: str | None) -> str | None:
    if filename is None or len(filename) == 0:
        return None

    extension_index = filename.rfind('.')
    return filename[extension_index + 1:] if extension_index > -1 else filename
