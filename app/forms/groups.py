from uuid import UUID
from django import forms
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile

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

        icon: InMemoryUploadedFile = self.cleaned_data.get("icon", None)
        name: str = self.cleaned_data.get("name", None)
        
        icon.name = preprocess_name(icon, name, self.user)
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
    icon = forms.ImageField(label="Bild")
    is_global = forms.BooleanField(required=False, widget=forms.HiddenInput(), initial=False)

    def __init__(self, *args, user, **kwargs):
        super(EditGroupForm, self).__init__(*args, **kwargs)

        assert user is not None

        self.user = user

    def clean_is_global(self):
        is_global = self.cleaned_data.get("is_global", None)
        if is_global and self.user["isAdmin"] == False:
            raise ValidationError("You are not allowed to create groups that are globally accessible")

        return is_global

    def clean_name(self):
        name = self.cleaned_data.get("is_global", None)
        if name in self.groups:
            raise ValidationError("Du hast schon eine Gruppe mit dem Namen %(group_name)s", { 'group_name': name })
        
        return name

    def clean(self):
        data = self.cleaned_data

        icon: InMemoryUploadedFile = self.cleaned_data.get("icon")
        name: str = self.cleaned_data.get("name", None)
        
        if icon is None:
            return ValidationError("Bitte ein Bild hochladen")
        if name is None or len(name) == 0 or str.isspace(name):
            raise ValidationError("Name leer")

        icon.name = preprocess_name(icon, name, self.user)
        return data

    class Meta:
        model = Group
        exclude = ['user']

def preprocess_name(icon: InMemoryUploadedFile, name: str, user: dict[str, any]) -> str:
    file_extension = icon.name[icon.name.rfind(".") + 1:]
    internal_filename = f"{name}.{file_extension}"

    # If this category is for a specific user, we want to prefix its name with the user id to allow different users to have the same private category
    if user is not None:
        user_id = str(user["id"])
        internal_filename = f"{user_id}_{internal_filename}"

    return internal_filename   