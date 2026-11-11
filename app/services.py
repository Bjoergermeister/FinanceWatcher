from datetime import date
from decimal import Decimal

from app.models.Bill import Bill
from app.models.Position import Position
from app.models.RecurrentPayment import RecurrentPayment, RecurrentPaymentFrequencies

from app.utils.dates import add_to_date, DateUnits

def create_recurrent_payment_bills(recurrent_payment: RecurrentPayment, price: Decimal, start_date: date, end_date: date | None = None) -> None:
    if end_date is None:
        end_date = date.today()
    
    bills: list[Bill] = []
    bill_positions = []
    current_date = start_date

    channel = "in_store"
    if recurrent_payment.brand is not None:
        channel = recurrent_payment.brand.default_channel

    date_unit = DateUnits.MONTH
    if recurrent_payment.frequency == RecurrentPaymentFrequencies.YEARLY:
        date_unit = DateUnits.YEAR
    elif recurrent_payment.frequency == RecurrentPaymentFrequencies.WEEKLY:
        date_unit = DateUnits.WEEK
    elif recurrent_payment.frequency == RecurrentPaymentFrequencies.DAILY:
        date_unit = DateUnits.DAY

    while current_date < date.today():
        bill = Bill(
            name=recurrent_payment.name,
            user_id=recurrent_payment.user_id,
            brand_id=recurrent_payment.brand_id,
            recurrent_payment_id=recurrent_payment.pk,
            date=current_date,
            created=current_date,
            total=price,
            channel=channel
        )
        bills.append(bill)
        current_date = add_to_date(current_date, date_unit, 1)

    Bill.objects.bulk_create(bills)

    bill_positions = [
        Position(
            bill_id=bills[i].pk,
            group_id=recurrent_payment.group_id,
            name=recurrent_payment.name,
            price=price,
            quantity=1.0
        )
        for i
        in range(0, len(bills))
    ]    

    Position.objects.bulk_create(bill_positions)