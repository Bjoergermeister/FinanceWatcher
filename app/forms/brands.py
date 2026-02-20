from __future__ import annotations

import datetime
import uuid

from django import forms
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db.models import QuerySet
from django.utils.translation import gettext as _

from app.models.Address import Address
from app.models.Brand import Brand

CHANNEL_CHOICES = [
    ('in_store', 'In-Store'),
    ('online', 'Online')
]

class CreateBrandForm(forms.ModelForm):
    icon = forms.ImageField(label=_("Bild"), required=False)
    default_channel = forms.ChoiceField(label=_('Standard-Verkaufsweg'), choices=CHANNEL_CHOICES)
    
    def __init__(self: CreateBrandForm, *args, **kwargs):
        super(CreateBrandForm, self).__init__(*args, **kwargs)

        self.internal_file_name = uuid.uuid4()

    def clean_name(self: CreateBrandForm) -> str:
        name: str | None = self.cleaned_data.get("name", None)
        if name is None or len(name) == 0 or str.isspace(name):
            raise ValidationError("Bitte gebe einen Namen an")
        
        if Brand.objects.filter(name=name).exists():
            raise ValidationError(
                "Es gibt bereits einen Brand mit dem Namen %(brand_name)s",
                params={ "brand_name": name }
            )
        
        return name
    
    def clean_icon(self: CreateBrandForm):
        icon: InMemoryUploadedFile = self.cleaned_data.get("icon", None)
        if icon is not None:
            icon.name = f"{self.internal_file_name}.jpg"

        return icon

    class Meta:
        exclude = ["addresses"]
        model = Brand

        labels = {
            "has_physical_stores": _("Hat Filialen")
        }

class EditBrandForm(CreateBrandForm):

    def clean_name(self: EditBrandForm) -> str:
        # We need to make sure that the name check does not throw an exception
        # if the name wasn't edited (and therefore already exists)
        # So, if the name didn't change, skip all further checks
        name: str | None = self.cleaned_data.get("name", None)
        if name is not None and name == self.instance.name:
            return name

        # Otherwise, proceed with the normal checks
        return super(EditBrandForm, self).clean_name()

    def clean_icon(self: EditBrandForm):
        icon: InMemoryUploadedFile | None = self.cleaned_data.get("icon", None)
        if icon is not None:
            icon.name = self.instance.icon.name

        return icon
    
class EditAddressAssociationForm(forms.Form):
    start_date = forms.DateField(label=_("Start date"), widget=forms.DateInput(attrs={"type": "date"}))
    end_date = forms.DateField(label=_("End date"), widget=forms.DateInput(attrs={"type": "date"}), required=False)

    def clean(self: EditAddressAssociationForm):
        start_date = self.cleaned_data.get("start_date")
        end_date = self.cleaned_data.get("end_date")
        
        # If the end date is None, we can stop because the start date cannot be later than the end date
        # If the start date is None, the form is invalid, but that is a single field error and has already
        # been handled by that clean method
        if start_date is None or end_date is None:
            return self.cleaned_data
        
        if start_date > end_date:
            raise ValidationError("Start date cannot be after end date")
        
        return self.cleaned_data

class AssignAddressesForm(forms.Form):
    addresses = forms.MultipleChoiceField(label=_("Addresses"))
    start_date = forms.DateField(label=_("Start date"), widget=forms.DateInput(attrs={"type": "date"}))
    end_date = forms.DateField(label=_("End date"), required=False, widget=forms.DateInput(attrs={"type": "date"}))

    def __init__(self: AssignAddressesForm, addresses: QuerySet[Address]):
        super(AssignAddressesForm, self).__init__()
        self.fields["addresses"].choices = [(address.id, str(address)) for address in addresses]
        
        today = datetime.date.today()
        self.fields["start_date"].initial = today
        self.fields["end_date"].initial = today