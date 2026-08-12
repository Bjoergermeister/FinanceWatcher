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
        name = self.cleaned_data.get("name", None)

        if name is None:
            return name

        if BillTemplate.objects.filter(user=self.user, name=name).exists():
            self.add_error("name", _("You already have a template with the name \"%(template_name)s\"") % { "template_name": name })

        return name

    def clean(self: CreateBillTemplatForm) -> dict[str, Any]:
        brand = self.cleaned_data.get("brand", None)
        group = self.cleaned_data.get("group", None)

        if brand is None and group is None:
            self.add_error(None, _("Please choose at least a brand or a group"))

        return self.cleaned_data

    class Meta:
        model = BillTemplate
        exclude = ["user"]


class EditBillTemplateForm(CreateBillTemplatForm):
    def clean_name(self: EditBillTemplateForm) -> str:
        name = self.cleaned_data.get("name", None)

        # If the name changed, we need to check if there is another bill template for this user in the database to eliminate duplicates.
        # If the name didn't change, this is not necessary because no other template with this name could have been created
        if name != self.instance.name:
            if BillTemplate.objects.filter(user=self.user, name=name).exists():
                self.add_error("name", _("You already have a template with the name \"%(template_name)s\"") % { "template_name": name })

        return name
