from django.db import models

import datetime

class Bill(models.Model):
    name = models.CharField(db_column="name", max_length=100)
    user = models.UUIDField(db_column="user")
    date = models.DateField(db_column="date")
    created = models.DateField(db_column="created", default=datetime.date.today)
    total = models.DecimalField(db_column="total", max_digits=13, decimal_places=2)
    description = models.TextField(db_column="description", blank=True, null=True)
    receipt = models.ImageField(db_column="receipt", blank=True, null=True)
    paid = models.BooleanField(db_column="paid", blank=True, null=False, default=True)

    class Meta:
        db_table = "Bill"
        app_label = "app"
        managed = True