from __future__ import annotations

import os

import datetime

from django import forms
from django.core.files.uploadedfile import InMemoryUploadedFile

from ..models.Bill import Bill, user_directory_path


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

    def __init__(self, *args, **kwargs):

        instance: Bill = kwargs.get("instance")
        self.internal_file_name = get_file_name_without_extension(instance.receipt.name)
        super(EditBillForm, self).__init__(*args, **kwargs)    

    def clean(self):
        data = self.cleaned_data

        receipt: InMemoryUploadedFile = data.get("receipt", None)
        if receipt is not None:
            file_extension = get_file_extension(receipt.name)
            receipt.name = f"{self.internal_file_name}.{file_extension}"

        return data
    
    def save(self: EditBillForm, was_file_uploaded: bool, commit: bool = True) -> Bill:
        if was_file_uploaded:
            full_path = os.path.join(
                self.instance.receipt.storage.location, 
                user_directory_path(self.instance, self.instance.receipt.name)
            )
            
            if os.path.isfile(full_path):
                os.remove(full_path)

        return super(EditBillForm, self).save(commit=commit)
    
    class Meta:
        model = Bill
        exclude = ["created"]

def get_file_name_without_extension(filename: str) -> str:
    extension_index = filename.rfind('.')
    return filename[:extension_index] if extension_index > -1 else filename

def get_file_extension(filename: str) -> str:
    extension_index = filename.rfind('.')
    return filename[extension_index + 1:] if extension_index > -1 else filename
