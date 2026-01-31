from __future__ import annotations

from typing import cast, Dict

from django.db import models


class BrandAddress(models.Model):
    brand = models.ForeignKey('Brand', on_delete=models.CASCADE, db_column='fk_brand')
    address = models.ForeignKey('Address', on_delete=models.CASCADE, db_column='fk_address')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'Brand_Address'

    def to_json(
        self: BrandAddress,
        include_id: bool = True,
        include_brand: bool = False,            
    ) -> Dict[str, str | Dict[str, str]]:
        from app.models.Brand import Brand
        from app.models.Address import Address

        json = {
            "address": cast(Address, self.address).to_dict(),
            "start_date": self.start_date.strftime("%d.%m.%Y"),
            "end_date": self.end_date.strftime("%d.%m.%Y") if self.end_date is not None else None
        }

        if include_id:
            json["id"] = self.pk

        if include_brand:
            json["brand"] = cast(Brand, self.brand).to_json(),

        return json

    def is_currently_assigned(self: BrandAddress) -> bool:
        return self.end_date is not None