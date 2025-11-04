from django.db import models

class ShopAddress(models.Model):
    shop = models.ForeignKey('Shop', on_delete=models.CASCADE, db_column='fk_shop')
    address = models.ForeignKey('Address', on_delete=models.CASCADE, db_column='fk_address')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'Company_Address'