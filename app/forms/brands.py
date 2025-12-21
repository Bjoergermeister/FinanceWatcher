from __future__ import annotations

import uuid

from django import forms
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.utils.translation import gettext as _

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
        return super(CreateBrandForm, self).clean_name()

    def clean_icon(self: EditBrandForm):
        icon: InMemoryUploadedFile | None = self.cleaned_data.get("icon", None)
        if icon is not None:
            icon.name = self.instance.icon.name

        return icon