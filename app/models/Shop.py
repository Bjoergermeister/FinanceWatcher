from django.db import models

from app.models.Address import Address
from app.models.ShopAddress import ShopAddress

class Shop(models.Model):
    name = models.CharField(max_length=200)
    addresses = models.ManyToManyField(Address, through=ShopAddress)
    has_physical_stores = models.BooleanField(default=False)
    default_channel = models.CharField(max_length=100)

    class Meta:
        db_table = 'Shop'
    