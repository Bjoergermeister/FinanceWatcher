from __future__ import annotations

import os

from typing import Any, Dict

from django.db import models
from django.templatetags.static import static

from app.models.Address import Address
from app.models.BrandAddress import BrandAddress

from app.utils.images import save_as_thumbnail

class Brand(models.Model):
    name = models.CharField(max_length=200)
    addresses = models.ManyToManyField(Address, through=BrandAddress, blank=True)
    has_physical_stores = models.BooleanField(default=False)
    default_channel = models.CharField(max_length=100)
    icon = models.ImageField(db_column="icon", null=True, upload_to="brands")

    def save(self: Brand, file_was_uploaded: bool, *args, **kwargs):
        if self.icon and file_was_uploaded:
            # If there already exists a file with the given name, we need to delete it because otherwise
            # Django generates a new name and uses that one.
            full_path = os.path.join(self.icon.storage.location, "brands", self.icon.name)
            if os.path.isfile(full_path):
                os.remove(full_path)
            
            # Apparently, Django adds the prefix specified in the upload_to option even if it already
            # exists. So if it exists, we remove it to prevent accumulation
            if self.icon.name.startswith("brands"):
                self.icon.name = self.icon.name.lstrip("brands/")

            self.icon = save_as_thumbnail(self.icon, thumbnail_size=250)

        super().save(*args, **kwargs)

    def get_icon_url(self: Brand) -> str:
        """
        Returns the url of the uploaded image.
        If no image for this brand is present in the system,
        the url to the default brand icon is returned
        
        :param self: Description
        :type self: Brand
        :return: Description
        :rtype: str
        """
        if self.icon and hasattr(self.icon, 'url'):
            return self.icon.url
        
        return static(f"images/default_brand_icon.png")

    def to_json(self: Brand) -> Dict[str, Any]:
        return {
            "pk": self.pk,
            "name": self.name,
            "has_physical_stores": self.has_physical_stores,
            "default_channel": self.default_channel,
            "icon": self.get_icon_url()
        }

    class Meta:
        db_table = 'Brand'
    