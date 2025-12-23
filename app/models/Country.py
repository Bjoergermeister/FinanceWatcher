from __future__ import annotations

from django.db import models

class Country(models.Model):
    name = models.CharField(max_length=100)
    internal_name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=3, unique=True)

    def __str__(self: Country) -> str:
        return self.name

    class Meta:
        db_table = 'Country'