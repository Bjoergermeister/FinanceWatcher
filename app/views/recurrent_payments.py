from __future__ import annotations

from datetime import date, datetime, timedelta

from django.core.handlers.wsgi import WSGIRequest
from django.db import transaction
from django.db.models import Prefetch, Q
from django.http import (
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseNotFound,
    JsonResponse,
    QueryDict
)
from django.shortcuts import render
from django.views import View


from app.forms.recurrent_payments import (
    CreateRecurrentPaymentForm,
    ChangeRecurrentPaymentPriceForm,
    EditRecurrentPaymentForm,
    RecurrentPaymentPriceFormset
)


from app.models.RecurrentPayment import RecurrentPayment
from app.models.RecurrentPaymentPrice import RecurrentPaymentPrice

from app.services import create_recurrent_payment_bills
from app.utils.request import get_bool_from_request

class RecurrentPaymentListView(View):
    def get(self: RecurrentPaymentListView, request: WSGIRequest) -> HttpResponse:

        price_prefetch = Prefetch("prices", queryset=RecurrentPaymentPrice.objects.filter(Q(valid_through=None) | Q(valid_through__gte=datetime.today().date()), valid_from__lte=datetime.today().date()))
        recurrent_payments = RecurrentPayment.objects.filter(user=request.user).prefetch_related(price_prefetch)

        context = {
            "recurrent_payments": recurrent_payments,
            "create_recurrent_payment_form": CreateRecurrentPaymentForm(request.user),
            "change_recurrent_payment_price_form": ChangeRecurrentPaymentPriceForm(),
            "edit_recurrent_payment_form": EditRecurrentPaymentForm(),
            "recurrent_payment_prices_formset": RecurrentPaymentPriceFormset(prefix="recurrent_payment_price", queryset=RecurrentPaymentPrice.objects.none())
        }

        return render(request, "recurrent_payments/list.html", context) 

    def post(self: RecurrentPaymentListView, request: WSGIRequest) -> HttpResponse:
        create_bills_retroactively = get_bool_from_request(request, "create-retroactively", False)
        
        create_recurrent_payment_form = CreateRecurrentPaymentForm(request.user, request.POST)
        if create_recurrent_payment_form.is_valid() is False:
            return JsonResponse(create_recurrent_payment_form.errors, status=400)


        with transaction.atomic():
            recurrent_payment = create_recurrent_payment_form.save(commit=False)

            recurrent_payment.user = request.user
            recurrent_payment.save()

            price = create_recurrent_payment_form.cleaned_data["price"]

            RecurrentPaymentPrice.objects.create(
                recurrent_payment=recurrent_payment,
                valid_from=recurrent_payment.start_date,
                valid_through=None,
                price=price
            )

            if recurrent_payment.start_date < date.today() and create_bills_retroactively:
                create_recurrent_payment_bills(recurrent_payment, price, recurrent_payment.start_date)

        return HttpResponse(recurrent_payment)


class RecurrentPaymentDetailView(View):
    def get(self: RecurrentPaymentDetailView, request: WSGIRequest, recurrent_payment_id: int) -> HttpResponse:
        recurrent_payment = RecurrentPayment.objects.filter(pk=recurrent_payment_id, user=request.user).prefetch_related("prices").first()
        if recurrent_payment is None:
            return HttpResponseNotFound()

        return JsonResponse(
            recurrent_payment.to_json()
        )

    def put(self: RecurrentPaymentDetailView, request: WSGIRequest, recurrent_payment_id: int) -> HttpResponse:
        recurrent_payment = RecurrentPayment.objects.filter(pk=recurrent_payment_id, user=request.user).prefetch_related("prices").first()
        if recurrent_payment is None:
            return HttpResponseNotFound()

        request_data = QueryDict(request.body)

        recurrent_payment_form = EditRecurrentPaymentForm(request_data, instance=recurrent_payment)
        if recurrent_payment_form.is_valid() is False:
            content = {
                "form_errors": recurrent_payment_form.errors,
            }
            return HttpResponseBadRequest()

        price_formset = RecurrentPaymentPriceFormset(request_data, queryset=recurrent_payment.prices.all(), prefix="recurrent_payment_price")
        if price_formset.is_valid() is False:
            content = {
                "form_errors": price_formset.errors,
                "formset_errors": price_formset.non_form_errors()
            }
            return JsonResponse(content, status=400)

        recurrent_payment_form.save()
        price_formset.save()

        return HttpResponse()


def change_recurrent_payment_price(request: WSGIRequest, recurrent_payment_id: int) -> HttpResponse:
    recurrent_payment = RecurrentPayment.objects.filter(pk=recurrent_payment_id, user=request.user).prefetch_related("prices").first()
    if recurrent_payment is None:
        return HttpResponseNotFound()

    change_recurrent_payment_price_form = ChangeRecurrentPaymentPriceForm(
        request.POST,
        instance=recurrent_payment
    )

    if change_recurrent_payment_price_form.is_valid() is False:
        return HttpResponseBadRequest()

    new_date = change_recurrent_payment_price_form.cleaned_data["date"]
    new_price = change_recurrent_payment_price_form.cleaned_data["price"]


    try:
        with transaction.atomic():
            # First update the valid_through date of the most recent price
            RecurrentPaymentPrice.objects.filter(valid_through=None, recurrent_payment=recurrent_payment).update(valid_through=new_date - timedelta(days=1))

            # Now create the new price
            RecurrentPaymentPrice.objects.create(
                recurrent_payment=recurrent_payment,
                price=new_price,
                valid_from=new_date,
                valid_through=None
            )
    except Exception as exception:
        return HttpResponseBadRequest(exception)

    return HttpResponse()
