from __future__ import annotations

from datetime import date, timedelta

from app.models.Bill import Bill
from app.models.Brand import Brand
from app.models.RecurrentPayment import RecurrentPayment, RecurrentPaymentFrequencies
from app.models.RecurrentPaymentPrice import RecurrentPaymentPrice

from app.management.commands.createrecurrentpayments import Command as CreateRecurrentPaymentsCommand
from app.test import FinanceWatcherTestCase, get_test_user

class CreateRecurrentPaymentsTestCase(FinanceWatcherTestCase):
    def test_createRecurrentPayment_yearlyPayment_monthAndDayMatch_isSelected(self: CreateRecurrentPaymentsTestCase) -> None:
        today = date.today()
        start_date = date(year=today.year - 1, month=today.month, day=today.day)

        payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.YEARLY,
            interval=0,
            start_date=start_date
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=100.0,
            valid_from=start_date,
            valid_through=None
        )

        command = CreateRecurrentPaymentsCommand()
        payments = command.get_recurrent_payments(today)

        self.assertEqual(payments.count(), 1)
        self.assertEqual(payments.first().pk, payment.pk)

    def test_createRecurrentPayment_yearlyPayment_monthAndDayMatch_startDateIsAfterCurrentYear_notPaymentsAreSelected(self: CreateRecurrentPaymentsTestCase) -> None:
        today = date.today()
        start_date = date(year=today.year + 1, month=today.month, day=today.day)

        payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.YEARLY,
            interval=0,
            start_date=start_date
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=100.0,
            valid_from=start_date,
            valid_through=None
        )

        command = CreateRecurrentPaymentsCommand()
        payments = command.get_recurrent_payments(today)

        self.assertEqual(payments.count(), 0)

    def test_createRecurrentPayment_monthlyPayment_dayMatches_paymentIsSelected(self: CreateRecurrentPaymentsTestCase) -> None:
        today = date.today()
        start_date = date(year=today.year -1, month=today.month - 1, day=today.day)

        payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.MONTHLY,
            interval=0,
            start_date=start_date
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=100.0,
            valid_from=start_date,
            valid_through=None
        )

        command = CreateRecurrentPaymentsCommand()
        payments = command.get_recurrent_payments(today)

        self.assertEqual(payments.count(), 1)
        self.assertEqual(payments.first().pk, payment.pk)

    def test_createRecurrentPayment_monthlyPayment_dayMatches_startsAfterCurrentYear_noPaymentIsSelected(self: CreateRecurrentPaymentsTestCase) -> None:
        today = date.today()
        start_date = date(year=today.year + 1, month=today.month - 1, day=today.day)

        payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.MONTHLY,
            interval=0,
            start_date=start_date
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=100.0,
            valid_from=start_date,
            valid_through=None
        )

        command = CreateRecurrentPaymentsCommand()
        payments = command.get_recurrent_payments(today)

        self.assertEqual(payments.count(), 0)

    def test_createRecurrentPayment_monthlyPayment_dayMatches_startsAfterCurrentMonth_noPaymentIsSelected(self: CreateRecurrentPaymentsTestCase) -> None:
        today = date.today()
        start_date = date(year=today.year, month=today.month + 1, day=today.day)

        payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.MONTHLY,
            interval=0,
            start_date=start_date
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=100.0,
            valid_from=start_date,
            valid_through=None
        )

        command = CreateRecurrentPaymentsCommand()
        payments = command.get_recurrent_payments(today)

        self.assertEqual(payments.count(), 0)

    def test_createRecurrentPayment_weeklyPayment_weekdayMatches_paymentIsSelected(self: CreateRecurrentPaymentsTestCase) -> None:
        today = date.today()
        start_date = today + timedelta(days=-7)

        payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.WEEKLY,
            interval=0,
            start_date=start_date
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=100.0,
            valid_from=start_date,
            valid_through=None
        )

        command = CreateRecurrentPaymentsCommand()
        payments = command.get_recurrent_payments(today)

        self.assertEqual(payments.count(), 1)
        self.assertEqual(payments.first().pk, payment.pk)

    def test_createRecurrentPayment_weeklyPayment_weekdayMatches_startAfterCurrentYear_noPaymentIsSelected(self: CreateRecurrentPaymentsTestCase) -> None:
        today = date.today()
        start_date = today + timedelta(days=-7) + timedelta(days=364)

        payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.WEEKLY,
            interval=0,
            start_date=start_date
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=100.0,
            valid_from=start_date,
            valid_through=None
        )

        command = CreateRecurrentPaymentsCommand()
        payments = command.get_recurrent_payments(today)

        self.assertEqual(payments.count(), 0)

    def test_createRecurrentPayment_weeklyPayment_weekdayMatches_startAfterCurrentMonth_noPaymentIsSelected(self: CreateRecurrentPaymentsTestCase) -> None:
        today = date.today()
        start_date = today + timedelta(days=35) # At least one month later

        payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.WEEKLY,
            interval=0,
            start_date=start_date
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=100.0,
            valid_from=start_date,
            valid_through=None
        )

        command = CreateRecurrentPaymentsCommand()
        payments = command.get_recurrent_payments(today)

        self.assertEqual(payments.count(), 0)

    def test_createRecurrentPayment_weeklyPayment_weekdayMatches_startAfterCurrentDate_noPaymentIsSelected(self: CreateRecurrentPaymentsTestCase) -> None:
        today = date.today()
        start_date = today + timedelta(days=7)

        payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.WEEKLY,
            interval=0,
            start_date=start_date
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=100.0,
            valid_from=start_date,
            valid_through=None
        )

        command = CreateRecurrentPaymentsCommand()
        payments = command.get_recurrent_payments(today)

        self.assertEqual(payments.count(), 0)

    def test_createRecurrentPayment_dailyPayment_startDateIsInThePast_paymentIsSelected(self: CreateRecurrentPaymentsTestCase) -> None:
        today = date.today()
        start_date = today - timedelta(days=7)

        payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.DAILY,
            interval=0,
            start_date=start_date
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=100.0,
            valid_from=start_date,
            valid_through=None
        )

        command = CreateRecurrentPaymentsCommand()
        payments = command.get_recurrent_payments(today)

        self.assertEqual(payments.count(), 1)
        self.assertEqual(payments.first().pk, payment.pk)

    def test_createRecurrentPayment_dailyPayment_startDateIsInTheFuture_noPaymentIsSelected(self: CreateRecurrentPaymentsTestCase) -> None:
        today = date.today()
        start_date = today + timedelta(days=7)

        payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.DAILY,
            interval=0,
            start_date=start_date
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=100.0,
            valid_from=start_date,
            valid_through=None
        )

        command = CreateRecurrentPaymentsCommand()
        payments = command.get_recurrent_payments(today)

        self.assertEqual(payments.count(), 0)

    def test_createRecurrentPayment_meetsMultiplePayments_multiplePaymentsAreSelected(self: CreateRecurrentPaymentsTestCase) -> None:
        today = date.today()

        yearly_payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.YEARLY,
            interval=0,
            start_date=date(today.year - 1, today.month, today.day)
        )

        monthly_payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.MONTHLY,
            interval=0,
            start_date=date(today.year - 1, today.month - 1, today.day + 1)
        )
        
        weekly_payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.WEEKLY,
            interval=0,
            start_date=today - timedelta(days=30)
        )

        daily_payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.DAILY,
            interval=0,
            start_date=today - timedelta(days=30)
        )


        command = CreateRecurrentPaymentsCommand()
        payments = command.get_recurrent_payments(today)        

        self.assertEqual(payments.count(), 2)

        payment_ids = payments.values_list("pk", flat=True)
        self.assertTrue(yearly_payment.pk in payment_ids)
        self.assertTrue(daily_payment.pk in payment_ids)
        self.assertTrue(monthly_payment.pk not in payment_ids)
        self.assertTrue(weekly_payment.pk not in payment_ids)

    def test_createRecurrentPayment_paymentHasOnePrice_priceIsSelected(self: CreateRecurrentPaymentsTestCase) -> None:
        today = date.today()
        start_date = today - timedelta(days=7)

        payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.DAILY,
            interval=0,
            start_date=start_date
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=100.0,
            valid_from=start_date,
            valid_through=None
        )

        command = CreateRecurrentPaymentsCommand()
        payments = command.get_recurrent_payments(today)

        self.assertEqual(payments.count(), 1)
        self.assertEqual(payments.first().prices.first().price, 100.0)

    def test_createRecurrentPayment_paymentHasMultiplePrices_currentlyValidPriceHasEndDate_onyValidPriceIsSelected(self: CreateRecurrentPaymentsTestCase) -> None:
        today = date.today()
        start_date = today - timedelta(days=7)

        payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.DAILY,
            interval=0,
            start_date=start_date
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=100.0,
            valid_from=start_date,
            valid_through=start_date + timedelta(days=14)
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=10.0,
            valid_from=start_date + timedelta(days=15),
            valid_through=None
        )

        command = CreateRecurrentPaymentsCommand()
        payments = command.get_recurrent_payments(today)

        self.assertEqual(payments.count(), 1)
        self.assertEqual(payments.first().prices.count(), 1)
        self.assertEqual(payments.first().prices.first().price, 100.0)

    def test_createRecurrentPayment_paymentHasMultiplePrices_currentlyValidPriceHasNoEndDate_onyValidPriceIsSelected(self: CreateRecurrentPaymentsTestCase) -> None:
        today = date.today()
        start_date = today - timedelta(days=7)

        payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.DAILY,
            interval=0,
            start_date=start_date
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=100.0,
            valid_from=start_date,
            valid_through=start_date + timedelta(days=5)
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=10.0,
            valid_from=start_date + timedelta(days=5),
            valid_through=None
        )

        command = CreateRecurrentPaymentsCommand()
        payments = command.get_recurrent_payments(today)

        self.assertEqual(payments.count(), 1)
        self.assertEqual(payments.first().prices.count(), 1)
        self.assertEqual(payments.first().prices.first().price, 10.0)

    def test_createRecurrentPayment_billIsCreated_billHasCorrectValues(self: CreateRecurrentPaymentsTestCase) -> None:
        today = date.today()
        start_date = today - timedelta(days=7)

        payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            name="test",
            frequency=RecurrentPaymentFrequencies.DAILY,
            interval=0,
            start_date=start_date
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=100.0,
            valid_from=start_date,
            valid_through=None
        )

        command = CreateRecurrentPaymentsCommand()
        payments = command.get_recurrent_payments(today)
        command.create_recurrent_payments(payments, today)

        self.assertEqual(Bill.objects.count(), 1)

        bill = Bill.objects.first()
        self.assertIsNone(bill.brand)
        self.assertEqual(bill.user_id, get_test_user().pk)
        self.assertEqual(bill.name, payment.name)
        self.assertEqual(bill.recurrent_payment_id, payment.pk)
        self.assertEqual(bill.total, payment.prices.first().price)

    def test_createRecurrentPayment_billIsCreated_recurrentPaymentHasBrand_createdBillHasCorrectBrand(self: CreateRecurrentPaymentsTestCase) -> None:
        today = date.today()
        start_date = today - timedelta(days=7)

        brand = Brand(
           name="test",
           has_physical_stores=True,
           default_channel="in_store"
        )
        brand.save(False)

        payment = RecurrentPayment.objects.create(
            user=get_test_user(),
            brand_id=brand.pk,
            name="test",
            frequency=RecurrentPaymentFrequencies.DAILY,
            interval=0,
            start_date=start_date
        )

        RecurrentPaymentPrice.objects.create(
            recurrent_payment=payment,
            price=100.0,
            valid_from=start_date,
            valid_through=None
        )

        command = CreateRecurrentPaymentsCommand()
        payments = command.get_recurrent_payments(today)
        command.create_recurrent_payments(payments, today)

        self.assertEqual(Bill.objects.count(), 1)

        bill = Bill.objects.first()
        self.assertEqual(bill.user_id, get_test_user().pk)
        self.assertEqual(bill.name, payment.name)
        self.assertEqual(bill.recurrent_payment_id, payment.pk)
        self.assertEqual(bill.total, payment.prices.first().price)
        self.assertEqual(bill.brand_id, brand.pk)