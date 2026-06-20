import uuid

from django import forms
from django.db.models import Q

from app.models.Position import Position
from app.models.Group import Group

class CreatePositionForm(forms.ModelForm):
    id = forms.IntegerField(required=False, widget=forms.HiddenInput())
    name = forms.CharField(label="", min_length=1, widget=forms.TextInput(attrs={ 'required': True }))
    price = forms.DecimalField(label="", decimal_places=3, initial=0.0)
    quantity = forms.DecimalField(label="", decimal_places=3, initial=1.0)
    note = forms.CharField(label="", required=False, widget=forms.HiddenInput())
    group = forms.ModelChoiceField(label="", required=False, queryset=Group.objects.none(), widget=forms.HiddenInput())

    uuid = forms.UUIDField(widget=forms.HiddenInput())

    def __init__(self, *args, **kwargs):
        user = kwargs.pop("user")
        super().__init__(*args, **kwargs)
        self.fields["group"].queryset = Group.objects.filter(Q(user=None) | Q(user=user))

        if self.is_bound == False:
            self.fields["uuid"].initial = uuid.uuid4()

    class Meta:
        model = Position
        exclude = ["bill"]

class EditPositionForm(forms.ModelForm):
    id = forms.IntegerField(widget=forms.HiddenInput())
    name = forms.CharField(label="", min_length=1, widget=forms.TextInput(attrs={ 'required': True }))
    price = forms.DecimalField(label="", decimal_places=2)
    quantity = forms.DecimalField(label="", decimal_places=2)
    note = forms.CharField(label="", required=False, widget=forms.HiddenInput())
    group = forms.ModelChoiceField(label="", required=False, queryset=Group.objects.none(), widget=forms.HiddenInput())

    uuid = forms.UUIDField(widget=forms.HiddenInput())

    def __init__(self, *args, **kwargs):
        user = kwargs.pop("user")
        super().__init__(*args, **kwargs)
        
        self.fields["group"].queryset = Group.objects.filter(Q(user=None) | Q(user=user))
        if self.is_bound == False:
            self.fields["uuid"].initial = uuid.uuid4()

    class Meta:
        model = Position
        exclude = []