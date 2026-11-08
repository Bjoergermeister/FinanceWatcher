from __future__ import annotations

from datetime import date

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Prefetch, Q, QuerySet
from django.db.models.functions import ExtractIsoWeekDay

from app.models.Bill import Bill
from app.models.Position import Position
from app.models.RecurrentPayment import RecurrentPayment, RecurrentPaymentFrequencies
from app.models.RecurrentPaymentPrice import RecurrentPaymentPrice


class Command(BaseCommand):

    def get_recurrent_payments(self: Command, date: date) -> QuerySet[RecurrentPayment]:
        yearly_payments = Q(frequency=RecurrentPaymentFrequencies.YEARLY, start_date__month=date.month, start_date__day=date.day)
        monthly_payments = Q(frequency=RecurrentPaymentFrequencies.MONTHLY, start_date__day=date.day)
        weekly_payments = Q(frequency=RecurrentPaymentFrequencies.WEEKLY, day_of_week=date.isoweekday())
        daily_payments = Q(frequency=RecurrentPaymentFrequencies.DAILY)

        price_prefetch = Prefetch("prices", queryset=RecurrentPaymentPrice.objects.filter(
            Q(valid_through=None) | Q(valid_through__gte=date),
            valid_from__lte=date
        ))

        return RecurrentPayment.objects.annotate(day_of_week=ExtractIsoWeekDay("start_date")).filter(
            Q(yearly_payments | monthly_payments | weekly_payments | daily_payments) & Q(start_date__lte=date)
        ).select_related("brand").prefetch_related(price_prefetch)

    def create_recurrent_payments(self: Command, payments: QuerySet[RecurrentPayment], date: date) -> None:
        for payment in payments:
            if payment.prices.count() == 0:
                continue

            price = payment.prices.first().price

            with transaction.atomic():
                bill = Bill.objects.create(
                    name=payment.name,
                    user_id=payment.user_id,
                    brand_id=payment.brand_id,
                    recurrent_payment_id=payment.pk,
                    date=date,
                    created=date,
                    total=price,
                    channel="in_store" if payment.brand is None else payment.brand.default_channel
                )

                Position.objects.create(
                    bill_id=bill.pk,
                    name=payment.name,
                    price=price,
                    quantity=1.0
                )

    def handle(self: Command, *args, **kwargs) -> None:
        today = date.today()
        payments = self.get_recurrent_payments(today)
        self.create_recurrent_payments(payments)
        