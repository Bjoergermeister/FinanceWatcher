from django import forms

from app.models.Address import Address

class CreateAddressForm(forms.ModelForm):
    
    class Meta:
        model = Address
        exclude = []