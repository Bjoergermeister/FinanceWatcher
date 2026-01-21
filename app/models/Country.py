from __future__ import annotations

import os

from typing import Dict

from django.db import models
from django.templatetags.static import static

class Country(models.Model):
    name = models.CharField(max_length=100)
    internal_name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=3, unique=True)

    def __str__(self: Country) -> str:
        return self.name

    def get_flag_url(self: Country):
        path = os.path.join("images", "countries", f"{self.name.lower()}.jpg")
        return static(path)
    
    def to_dict(self: Country) -> Dict[str, str]:
        return {
            "id": self.pk,
            "name": self.name,
            "code": self.code,
            "url": self.get_flag_url()
        }

    class Meta:
        db_table = 'Country'