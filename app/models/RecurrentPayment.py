from enum import StrEnum

from django.db import models

from app.models.User import User
from app.models.Brand import Brand

class RecurrentPaymentFrequencies(StrEnum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"    


class RecurrentPayment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column="fk_user", related_name="recurrent_payments")
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, db_column="fk_brand", null=True, related_name="recurrent_payments")
    name = models.CharField(db_column="name")
    start_date = models.DateField(db_column="start_date")
    frequency = models.CharField(db_column="frequency")
    interval = models.IntegerField(db_column="interval")

    class Meta:
        db_table = "RecurrentPayment"
