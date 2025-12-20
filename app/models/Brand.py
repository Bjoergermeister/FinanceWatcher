from django.db import models

from app.models.Address import Address
from app.models.BrandAddress import BrandAddress

class Brand(models.Model):
    name = models.CharField(max_length=200)
    addresses = models.ManyToManyField(Address, through=BrandAddress, blank=True)
    has_physical_stores = models.BooleanField(default=False)
    default_channel = models.CharField(max_length=100)
    icon = models.ImageField(db_column="icon", null=True, upload_to="brands")

    class Meta:
        db_table = 'Brand'
    