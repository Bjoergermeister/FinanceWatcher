from __future__ import annotations
from typing import Any

from django.db import models
from django.forms.models import model_to_dict

from app.models.Address import Address
from app.models.Brand import Brand
from app.models.User import User
from app.models.Group import Group


class BillTemplate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bill_templates")
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, blank=True, null=True)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, blank=True, null=True)
    group = models.ForeignKey(Group, on_delete=models.SET_NULL, blank=True, null=True)

    name = models.CharField(max_length=100)

    def to_dict(self: BillTemplate, include_brand: bool = False, include_address: bool = False, include_group: bool = False) -> dict[str, Any]:
        template = model_to_dict(self)

        if include_brand and self.brand is not None:
            template["brand"] = self.brand.to_json()
        if include_address and self.address is not None:
            template["address"] = self.address.to_dict()
        if include_group and self.group is not None:
            template["group"] = self.group.to_dict()

        return template
        
    class Meta:
        db_table = "BillTemplate"
        constraints = [
            models.UniqueConstraint(name="user_name_unique", fields=["user", "name"])
        ]