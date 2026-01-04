from __future__ import annotations

import os

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

    class Meta:
        db_table = 'Country'