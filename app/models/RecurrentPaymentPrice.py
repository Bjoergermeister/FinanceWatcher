from django.db import models

from app.models.RecurrentPayment import RecurrentPayment

class RecurrentPaymentPrice(models.Model):
    recurrent_payment = models.ForeignKey(RecurrentPayment, on_delete=models.CASCADE, db_column="fk_recurrent_payment", related_name="prices")
    price = models.DecimalField(db_column="price", max_digits=13, decimal_places=3)
    valid_from = models.DateField(db_column="valid_from")
    valid_through = models.DateField(db_column="valid_through", null=True)

    class Meta:
        db_table = "RecurrentPaymentPrice"