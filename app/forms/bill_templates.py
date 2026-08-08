from __future__ import annotations

from typing import Any

from django import forms
from django.db.models import Q
from django.utils.translation import gettext as _

from app.models.BillTemplate import BillTemplate
from app.models.Group import Group
from app.models.User import User

class CreateBillTemplatForm(forms.ModelForm):

    def __init__(self: CreateBillTemplatForm, user: User, *args, **kwargs) -> None:
        super(CreateBillTemplatForm, self).__init__(*args, **kwargs)

        self.user = user

        if self.is_bound:
            self.fields["group"].queryset = Group.objects.filter(Q(user=None) | Q(user=user))

    def clean_name(self: CreateBillTemplatForm) -> str:
        name = self.cleaned_data["name"]

        if name is None:
            return name

        if BillTemplate.objects.filter(user=self.user, name=name).exists():
            self.add_error("name", _("You already have a template with the name \"%(template_name)s\"") % { "template_name": name })

        return name

    def clean(self: CreateBillTemplatForm) -> dict[str, Any]:
        brand = self.cleaned_data["brand"]
        group = self.cleaned_data["group"]

        if brand is None and group is None:
            self.add_error(None, _("Please choose at least a brand or a group"))

        return self.cleaned_data

    class Meta:
        model = BillTemplate
        exclude = ["user"]
