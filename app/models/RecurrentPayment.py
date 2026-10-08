from __future__ import annotations

from enum import StrEnum
from typing import Any, Dict

from django.db import models
from django.forms.models import model_to_dict

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

    def to_json(self: RecurrentPayment) -> Dict[str, Any]:
        result = model_to_dict(self)

        if self.prices is not None:
            result["prices"] = [model_to_dict(price) for price in self.prices.all()]

        return result

    class Meta:
        db_table = "RecurrentPayment"
