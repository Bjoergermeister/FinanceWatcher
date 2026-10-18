from __future__ import annotations

from datetime import date, datetime
from typing import cast, List


from django import forms
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

from django.forms import modelformset_factory, BaseModelFormSet

from app.models.RecurrentPayment import RecurrentPayment, RecurrentPaymentFrequencies
from app.models.RecurrentPaymentPrice import RecurrentPaymentPrice
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
        self.fields["start_date"].widget.attrs.update({"min": datetime.today().strftime("%Y-%m-%d")})

    def save(self: CreateRecurrentPaymentForm, commit: bool = True) -> RecurrentPayment:
        return cast(RecurrentPayment, super(CreateRecurrentPaymentForm, self).save())

    class Meta:
        model = RecurrentPayment
        exclude = []



class BaseRecurrentPaymentPriceFormset(BaseModelFormSet):
    def clean(self: BaseRecurrentPaymentPriceFormset):
        if any(self.errors):
            return 

        forms = cast(List[RecurrentPaymentPriceForm], self.forms)
        if len(forms) == 1:
            return

        for index in range(len(forms) - 1):
            first_form = forms[index]
            second_form = forms[index + 1]

            first_form_valid_through = first_form.cleaned_data.get("valid_through", None)
            second_form_valid_from = second_form.cleaned_data.get("valid_from", None)

            if first_form_valid_through is None:
                first_form.add_error("valid_through", "This pricing period must have an end date because it's followed by another price period")
                return

            if second_form_valid_from is not None and first_form_valid_through >= second_form_valid_from:
                first_form.add_error("valid_through", "The end of this price period must be before the start of the next price period")
            


class RecurrentPaymentPriceForm(forms.ModelForm):
    valid_through = forms.DateField(required=False)

    def __init__(self: RecurrentPaymentPriceForm, *args, **kwargs) -> None:
        super(RecurrentPaymentPriceForm, self).__init__(*args, **kwargs)

    def clean(self: RecurrentPaymentPriceForm):
        valid_from = self.cleaned_data.get("valid_from", None)
        valid_through = self.cleaned_data.get("valid_through", None)

        if valid_through is not None and valid_from > valid_through:
            self.add_error("valid_from", _("Valid through must be after valid from"))

        return self.cleaned_data

    class Meta:
        model = RecurrentPaymentPrice
        exclude = ["recurrent_payment"]


RecurrentPaymentPriceFormset = modelformset_factory(
    RecurrentPaymentPrice,
    RecurrentPaymentPriceForm,
    formset=BaseRecurrentPaymentPriceFormset,
    extra=0,
    can_delete=False,
    can_order=False,
)


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

class EditRecurrentPaymentForm(forms.ModelForm):
    frequency = forms.ChoiceField(choices=FREQUENCY_CHOICES)

    def __init__(self: EditRecurrentPaymentForm, *args, **kwargs) -> None:
        super(EditRecurrentPaymentForm, self).__init__(*args, **kwargs)

        self.fields["start_date"].disabled = True
        self.fields["start_date"].widget.attrs.update({"format": "dd.mm.yyyy"})

    class Meta:
        model = RecurrentPayment
        exclude = ["user", "interval"]