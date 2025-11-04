from django.db import models

from app.models.Country import Country

class Address(models.Model):
    country = models.ForeignKey(Country, on_delete=models.PROTECT, db_column='fk_country')
    region = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100)
    street = models.CharField(max_length=200)
    number = models.CharField(max_length=20)
    additional_info = models.CharField(max_length=200, null=True, blank=True)
    postal_code = models.CharField(max_length=20)

    class Meta:
        db_table = 'Address'