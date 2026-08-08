from django.db import models

from app.models.Address import Address
from app.models.Brand import Brand
from app.models.User import User
from app.models.Group import Group


class BillTemplate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bill_templates")
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, blank=True, null=True)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, blank=True, null=True)
    group = models.ForeignKey(Group, on_delete=models.SET_NULL, blank=True, null=True)

    name = models.CharField(max_length=100)

    class Meta:
        db_table = "BillTemplate"
        constraints = [
            models.UniqueConstraint(name="user_name_unique", fields=["user", "name"])
        ]