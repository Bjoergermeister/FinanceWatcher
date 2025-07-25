from __future__ import annotations

import os

from typing import Any, Dict

from io import BytesIO
from django.core.files import File
from django.db import models
from django.db.models import Q, QuerySet
from django.templatetags.static import static

from PIL import Image

class Group(models.Model):
    name = models.CharField(db_column="name")
    user = models.UUIDField(db_column="user", null=True)
    icon = models.ImageField(db_column="icon", null=True, upload_to="groups")

    def to_dict(self) -> Dict[str, Any]:
        group = {
            "id": self.pk,
            "name": self.name,
            "icon": self.get_url()
        }
        
        group["user"] = self.user if self.user is not None else None
                
        return group

    @staticmethod
    def get_all_for_user(user: dict[str, Any], **kwargs) -> QuerySet[Group, str]:
        exclude_id: int = kwargs.pop("exclude_id", None)

        groups_query = Q(user=user["id"])
        if user["isAdmin"]:
            groups_query |= Q(user=None)

        groups = Group.objects.filter(groups_query)
        if exclude_id is not None:
            groups = groups.exclude(id=exclude_id)
        
        return groups.values_list("name", flat=True)

    def get_url(self: Group) -> str:
        if self.icon is None:
            return static(f"images/groups/Uncategorized.webp")
        
        if self.user is None:
            static_image_name = f"images/groups/{self.name}.webp"
            return static(static_image_name)
        
        return self.icon.url
        

    def save(self, file_was_uploaded: bool, *args, **kwargs) -> None:
        if self.icon and file_was_uploaded:
            
            # If there already exists a file with the given name, we need to delete it because otherwise
            # Django generate a new name and uses that one.
            full_path = os.path.join(self.icon.storage.location, "groups", self.icon.name)
            if os.path.isfile(full_path):
                os.remove(full_path)

            image = Image.open(self.icon)
            
            if self.icon.name.startswith("groups"):
                self.icon.name = self.icon.name.lstrip("groups/")

            smaller_side = min(image.width, image.height)
            ratio = 1 / (smaller_side / 250)
            size = (int(image.width * ratio), int(image.height * ratio))
            image.thumbnail(size)

            x = (image.width - 250) / 2
            y = (image.height - 250) / 2

            image = image.crop((x, y, image.width - x, image.height - y))
            image_bytes = BytesIO()
            image.save(image_bytes, 'JPEG', quality=70)
            self.icon = File(image_bytes, name=self.icon.name)

        super().save(*args, **kwargs)

    class Meta:
        db_table = "Group"