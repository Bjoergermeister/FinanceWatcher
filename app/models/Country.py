from django.db import models

class Country(models.Model):
    name = models.CharField(max_length=100)
    internal_name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=3, unique=True)

    class Meta:
        db_table = 'Country'