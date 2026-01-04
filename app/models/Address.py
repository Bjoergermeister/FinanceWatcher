from __future__ import annotations

from typing import Dict

from django.db import models
from django.forms import model_to_dict

from app.models.Country import Country

class Address(models.Model):
    country = models.ForeignKey(Country, on_delete=models.PROTECT, db_column='fk_country')
    region = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100)
    street = models.CharField(max_length=200)
    number = models.CharField(max_length=20)
    additional_info = models.CharField(max_length=200, null=True, blank=True)
    postal_code = models.CharField(max_length=20)

    def __str__(self: Address) -> str:
        return f"{self.street} {self.number}, {self.city}, {self.country.name}" 

    def to_dict(self: Address) -> Dict[str, str]:
        return {
            "id": self.pk,
            "country": model_to_dict(self.country),
            "region": self.region,
            "city": self.city,
            "street": self.street,
            "number": self.number,
            "additional_info": self.additional_info,
            "postal_code": self.postal_code,
        }

    class Meta:
        db_table = 'Address'