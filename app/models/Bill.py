from __future__ import annotations

import datetime
from io import BytesIO
import os

from PIL import Image

from django.core.files import File
from django.db import models

from app.models.Shop import Shop
from app.models.Address import Address

def user_directory_path(instance: Bill, filename: str) -> str:
    """
    Returns the path where the image of the receipt gets saved
    """
    return f"receipts/{instance.user}/{filename}"

class Bill(models.Model):
    name = models.CharField(db_column="name", max_length=100)
    user = models.UUIDField(db_column="user")
    date = models.DateField(db_column="date")
    created = models.DateField(db_column="created", default=datetime.date.today)
    total = models.DecimalField(db_column="total", max_digits=13, decimal_places=2)
    description = models.TextField(db_column="description", blank=True, null=True)
    receipt = models.ImageField(db_column="receipt", upload_to=user_directory_path, blank=True, null=True)
    paid = models.BooleanField(db_column="paid", blank=True, null=False, default=True)
    shop = models.ForeignKey(Shop, on_delete=models.SET_NULL, db_column='fk_shop', blank=True, null=True)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, db_column='fk_address', blank=True, null=True)
    channel = models.CharField(db_column="channel", max_length=100, default="in_store")

    def save(self, file_was_uploaded: bool = False, *args, **kwargs) -> None:
        if self.receipt and file_was_uploaded:
            # If there already exists a file with the given name, we need to delete it because otherwise
            # Django generates a new name and uses that one.
            full_path = os.path.join(self.receipt.storage.location, "receipts", str(self.user), self.receipt.name)
            if os.path.isfile(full_path):
                os.remove(full_path)

            # We save images as JPEGs. If the uploaded image is a PNG with transparency,
            # we need to convert it to RGB first to get rid of the alpha channel
            image = Image.open(self.receipt).convert("RGB")

            image_bytes = BytesIO()
            image.save(image_bytes, 'JPEG', quality=70)
            self.receipt = File(image_bytes, name=self.receipt.name)

        super(Bill, self).save(*args, **kwargs)

    class Meta:
        db_table = "Bill"
        app_label = "app"
        managed = True