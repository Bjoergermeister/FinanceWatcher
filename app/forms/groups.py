from django import forms

from ..models.Group import Group

class CreateGroupForm(forms.ModelForm):
    user = forms.UUIDField(widget=forms.HiddenInput(), required=False)
    icon = forms.ImageField(label="Bild")

    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        if user is not None:
            self.fields["user"].initial = user['id']

    class Meta:
        model = Group
        exclude = []

class EditGroupForm(forms.ModelForm):

    class Meta:
        model = Group
        exclude = []