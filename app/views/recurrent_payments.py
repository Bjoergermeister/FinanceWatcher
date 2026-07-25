from __future__ import annotations

from django.core.handlers.wsgi import WSGIRequest
from django.db import transaction
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views import View


from app.forms.recurrent_payments import CreateRecurrentPaymentForm

from app.models.RecurrentPayment import RecurrentPayment
from app.models.RecurrentPaymentPrice import RecurrentPaymentPrice

class RecurrentPaymentListView(View):
    def get(self: RecurrentPaymentListView, request: WSGIRequest) -> HttpResponse:

        recurrent_payments = RecurrentPayment.objects.filter(user=request.user)

        context = {
            "recurrent_payments": recurrent_payments,
            "create_recurrent_payment_form": CreateRecurrentPaymentForm(request.user)
        }

        return render(request, "recurrent_payments/list.html", context) 

    def post(self: RecurrentPaymentListView, request: WSGIRequest) -> HttpResponse:
        
        create_recurrent_payment_form = CreateRecurrentPaymentForm(request.user, request.POST)
        if create_recurrent_payment_form.is_valid() is False:
            return JsonResponse(create_recurrent_payment_form.errors, status_code=400)


        with transaction.atomic():
            recurrent_payment = create_recurrent_payment_form.save(commit=False)

            recurrent_payment.user = request.user
            recurrent_payment.save()

            RecurrentPaymentPrice.objects.create(
                recurrent_payment=recurrent_payment,
                valid_from=recurrent_payment.start_date,
                valid_through=None,
                price=create_recurrent_payment_form.cleaned_data["price"]
            )

        return HttpResponse(recurrent_payment)