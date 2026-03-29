from __future__ import annotations

from typing import List

import random 
from datetime import date, datetime, timedelta
from uuid import uuid4

from django.core.management.base import BaseCommand
from django.db import transaction

from app.models.Address import Address
from app.models.Bill import Bill
from app.models.Brand import Brand
from app.models.Group import Group
from app.models.Position import Position
from app.models.User import User

BILL_COUNT = 50

class Command(BaseCommand):
    help = "Creates random dummy bill data for development and testing purposes"

    def handle(self: Command, *args, **options):
        user = User.objects.first()

        groups = list(Group.objects.filter(user=None))
        brands = list(Brand.objects.all())

        try:
            with transaction.atomic():
                create_random_bills(user, groups, brands)
        except Exception as exception:
            print(exception)

def create_random_bills(user: User, groups: List[Group], brands: List[Brand]) -> None:
    dates = get_bill_dates(BILL_COUNT)

    for bill_index in range(BILL_COUNT):
        bill_name = uuid4()
        bill_brand = brands[random.randint(0, len(brands) - 1)]

        addresses = list(Address.objects.filter(brand=bill_brand))
        bill_address = None
        if bill_brand.has_physical_stores:
            bill_address = addresses[random.randint(0, len(addresses) - 1)]

        additional_groups_count = random.randint(2, 5)
        bill_groups = get_random_groups(groups, additional_groups_count, include_default=True)

        bill_total = 0
        positions = []
        for group in bill_groups:
            position_count = random.randint(5, 10)
            
            positions.extend([
                Position(
                    group=group,
                    name=uuid4(),
                    price=random.random() * 10,
                    quantity=random.random() * 10                        
                )
                for _
                in range(position_count)
            ])

            bill_total += sum(position.quantity * position.price for position in positions)

        new_bill = Bill.objects.create(
            name=bill_name,
            user=user,
            date=dates[bill_index],
            total=bill_total,
            brand=bill_brand,
            address=bill_address
        )

        for position in positions:
            position.bill = new_bill

        Position.objects.bulk_create(positions)

def get_random_groups(groups: List[Group], count: int, include_default: bool = True) -> List[Group]:
    indices = random.sample(range(len(groups)), count)

    groups = [group for index, group in enumerate(groups) if index in indices]

    if include_default:
        groups.insert(0, None)

    return groups

def get_bill_dates(count: int) -> List[date]:
    
    today = datetime.today()

    current = today
    dates = [current.date()]
    for i in range(count):
        current -= timedelta(days=random.randint(3, 10))
        dates.append(current.date())

    return dates