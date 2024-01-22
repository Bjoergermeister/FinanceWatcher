from django.db import models

class Group(models.Model):
    name = models.CharField(db_column="name")
    user = models.UUIDField(db_column="user", null=True)
    icon = models.ImageField(db_column="icon", null=True, upload_to="groups")

    class Meta:
        db_table = "Group"