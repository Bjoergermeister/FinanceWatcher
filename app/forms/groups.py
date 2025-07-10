import uuid

from django import forms
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db.models.fields.files import ImageFieldFile

from ..models.Group import Group

class CreateGroupForm(forms.ModelForm):
    icon = forms.ImageField(label="Bild")
    is_global = forms.BooleanField(required=False, widget=forms.HiddenInput(), initial=False)

    def __init__(self, user, *args, **kwargs):
        user_groups = kwargs.pop("user_groups", None)
        super(CreateGroupForm, self).__init__(*args, **kwargs)

        assert user is not None

        self.user = user
        self.groups = user_groups

        self.internal_file_name = uuid.uuid4()

    def clean_name(self):
        name = self.cleaned_data.get("name", None)

        if name is None or len(name) == 0 or str.isspace(name):
            raise ValidationError("Bitte gebe einen Namen an")

        assert self.groups is not None

        if name in self.groups:
            raise ValidationError("Du hast schon eine Gruppe mit dem Namen \"%(group_name)s\"", params={ 'group_name': name })
        
        return name

    def clean(self):
        data = self.cleaned_data

        icon: InMemoryUploadedFile = data.get("icon", None)
        
        file_extension = icon.name[icon.name.rfind(".") + 1:]
        icon.name = f"{self.internal_file_name}.{file_extension}"

        return data
    
    def save(self, commit=True):
        instance: Group = super().save(commit=False)

        is_global = self.cleaned_data.get("is_global")
        if is_global == False:
            instance.user = self.user["id"]
        
        if commit:
            instance.save()

        return instance

    class Meta:
        model = Group
        exclude = ['user']

class EditGroupForm(forms.ModelForm):
    icon = forms.ImageField(label="Bild", required=False)
    is_global = forms.BooleanField(required=False, widget=forms.HiddenInput(), initial=False)

    def __init__(self, user, *args, **kwargs):
        user_groups = kwargs.pop("user_groups", None)
        super(EditGroupForm, self).__init__(*args, **kwargs)

        assert user is not None

        self.user = user
        self.groups = user_groups

    def clean_icon(self):
        data = self.cleaned_data

        icon: ImageFieldFile = data.get("icon")
        icon.name = self.instance.icon.name

        return icon

    def clean_name(self):
        name = self.cleaned_data.get("name", None)
        if name in self.groups:
            raise ValidationError("Du hast schon eine Gruppe mit dem Namen %(group_name)s", params={ 'group_name': name })
        
        return name
            
    class Meta:
        model = Group
        exclude = ['user'] 