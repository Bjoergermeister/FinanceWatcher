from django import forms
from django.db.models import Q

from ..models.Position import Position
from ..models.Group import Group

class CreatePositionForm(forms.ModelForm):
    name = forms.CharField(label="", min_length=1, widget=forms.TextInput(attrs={ 'required': True }))
    price = forms.DecimalField(label="", decimal_places=2, initial=0.0)
    quantity = forms.DecimalField(label="", decimal_places=2, initial=1.0)
    note = forms.CharField(label="", required=False, widget=forms.HiddenInput())
    group = forms.ModelChoiceField(label="", required=False, queryset=Group.objects.none(), widget=forms.HiddenInput())

    def __init__(self, *args, **kwargs):
        data = kwargs.get("data")
        user = data["user"] if data is not None else None
        super().__init__(*args, **kwargs)
        #TODO: Optimize so that only one database query is made
        self.fields["group"].queryset = Group.objects.filter(Q(user=None) | Q(user=user))

    class Meta:
        model = Position
        exclude = ["bill"]

class EditPositionForm(forms.ModelForm):
    id = forms.IntegerField(widget=forms.HiddenInput())
    bill = forms.IntegerField(widget=forms.HiddenInput())
    name = forms.CharField(label="", min_length=1, widget=forms.TextInput(attrs={ 'required': True }))
    price = forms.DecimalField(label="", decimal_places=2)
    quantity = forms.DecimalField(label="", decimal_places=2)
    note = forms.CharField(label="", required=False, widget=forms.HiddenInput())

    class Meta:
        model = Position
        exclude = []