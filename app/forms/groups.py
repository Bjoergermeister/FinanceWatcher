from django import forms

from ..models.Group import Group

class CreateGroupForm(forms.ModelForm):
    user = forms.UUIDField(widget=forms.HiddenInput())

    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        if user is not None:
            self.fields["user"].initial = user['id']

    class Meta:
        model = Group
        exclude = []