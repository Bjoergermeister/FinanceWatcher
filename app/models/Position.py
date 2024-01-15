from django.db import models

from .Bill import Bill
from .Group import Group

class Position(models.Model):    
    bill = models.ForeignKey(Bill, db_column="bill", on_delete=models.CASCADE, related_name="positions")
    group = models.ForeignKey(Group, db_column="group", on_delete=models.CASCADE, null=True)
    name = models.CharField(db_column="name", max_length=128)
    price = models.DecimalField(db_column="price", max_digits=13, decimal_places=2)
    quantity = models.DecimalField(db_column="quantity", max_digits=13, decimal_places=2)
    note = models.TextField(db_column="note", blank=True, null=True)

    class Meta:
        db_table = "Position"