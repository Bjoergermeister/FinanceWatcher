from django.db import models

class BrandAddress(models.Model):
    brand = models.ForeignKey('Brand', on_delete=models.CASCADE, db_column='fk_brand')
    address = models.ForeignKey('Address', on_delete=models.CASCADE, db_column='fk_address')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'Brand_Address'