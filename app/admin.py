from django.contrib import admin

from .models.Bill import Bill
from .models.Position import Position

# Register your models here.
admin.site.register(Bill)
admin.site.register(Position)