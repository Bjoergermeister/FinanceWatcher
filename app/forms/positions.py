from django import forms

from ..models.Position import Position

class CreatePositionForm(forms.ModelForm):
    name = forms.CharField(label="")
    price = forms.DecimalField(label="", decimal_places=2, initial=0.0)
    quantity = forms.DecimalField(label="", decimal_places=2, initial=1.0)
    note = forms.CharField(widget=forms.HiddenInput())

    class Meta:
        model = Position
        exclude = ["bill"]