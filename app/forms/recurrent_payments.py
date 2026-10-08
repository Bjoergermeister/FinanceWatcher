from __future__ import annotations

from datetime import datetime
from typing import cast


from django import forms
from django.utils.translation import gettext as _

from app.models.RecurrentPayment import RecurrentPayment, RecurrentPaymentFrequencies
from app.models.User import User

FREQUENCY_CHOICES = [
    (RecurrentPaymentFrequencies.DAILY, RecurrentPaymentFrequencies.DAILY.capitalize()),
    (RecurrentPaymentFrequencies.WEEKLY, RecurrentPaymentFrequencies.WEEKLY.capitalize()),
    (RecurrentPaymentFrequencies.MONTHLY, RecurrentPaymentFrequencies.MONTHLY.capitalize()),
    (RecurrentPaymentFrequencies.YEARLY, RecurrentPaymentFrequencies.YEARLY.capitalize())
]

class CreateRecurrentPaymentForm(forms.ModelForm):
    user = forms.ModelChoiceField(queryset=User.objects.none(), disabled=True)
    price = forms.DecimalField(max_digits=13, decimal_places=3)
    frequency = forms.ChoiceField(choices=FREQUENCY_CHOICES)
    start_date = forms.DateField(label=_('First payment date'), widget=forms.DateInput(attrs={ "type": "date", "class": "form-control dateinput" }))

    def __init__(self: CreateRecurrentPaymentForm, user: User, *args, **kwargs):
        super(CreateRecurrentPaymentForm, self).__init__(*args, **kwargs)

        self.fields["user"].queryset = User.objects.filter(pk=user.pk)
        self.fields["user"].initial = user

        self.fields["frequency"].initial = RecurrentPaymentFrequencies.MONTHLY
        self.fields["start_date"].initial = datetime.today().strftime("%Y-%m-%d")

    def save(self: CreateRecurrentPaymentForm, commit: bool = True) -> RecurrentPayment:
        return cast(RecurrentPayment, super(CreateRecurrentPaymentForm, self).save())

    class Meta:
        model = RecurrentPayment
        exclude = []
class ChangeRecurrentPaymentPriceForm(forms.Form):
    price = forms.DecimalField(label=_("New price"), max_digits=13, decimal_places=3, min_value=0)
    date = forms.DateField(label=_("Start date"), help_text=_("The day when the updated price takes effect"), widget=forms.DateInput(attrs={ "type": "date", "class": "form-control dateinput" }))

    def __init__(self: ChangeRecurrentPaymentPriceForm, *args, **kwargs) -> None:
        instance: RecurrentPayment = kwargs.pop("instance", None)
        super(ChangeRecurrentPaymentPriceForm, self).__init__(*args, **kwargs)

        self.instance = instance

        self.fields["date"].widget.attrs.update({ "min": datetime.today().date() })

    def clean_date(self: ChangeRecurrentPaymentPriceForm) -> date:
        return self.cleaned_data["date"]
