from __future__ import annotations

import os

from typing import Any, Dict

from django.db import models
from django.db.models import Q, QuerySet
from django.templatetags.static import static

from app.utils.images import save_as_thumbnail


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
            groups = groups.exclude(pk=exclude_id)
        
        return groups.values_list("name", flat=True)

    def get_url(self: Group) -> str:
        """
        Returns the url for the icon for this group
        
        :param self: Description
        :type self: Group
        :return: Description
        :rtype: str
        """
        if self.icon and hasattr(self.icon, 'url'):
            return self.icon.url
        
        # If the group has no icon but it belongs to an individual user,
        # we return a standard user group icon
        if self.user:
            return static("images/groups/default_user_group_icon.png")
        
        # Otherwise, we return the standard global group icon
        return static(f"images/groups/{self.name}.webp")

  
    def save(self, file_was_uploaded: bool = False, *args, **kwargs) -> None:
        if self.icon and file_was_uploaded:
            
            # If there already exists a file with the given name, we need to delete it because otherwise
            # Django generates a new name and uses that one.
            full_path = os.path.join(self.icon.storage.location, "groups", self.icon.name)
            if os.path.isfile(full_path):
                os.remove(full_path)
            
            if self.icon.name.startswith("groups"):
                self.icon.name = self.icon.name.lstrip("groups/")

            self.icon = save_as_thumbnail(self.icon, thumbnail_size=250)            

        super().save(*args, **kwargs)

    class Meta:
        db_table = "Group"