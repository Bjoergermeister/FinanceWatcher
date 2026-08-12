from __future__ import annotations

from typing import cast

from django.core.handlers.wsgi import WSGIRequest
from django.db import transaction
from django.db.models import Q
from django.forms.models import model_to_dict
from django.http import HttpResponse, JsonResponse, QueryDict
from django.shortcuts import render
from django.views import View

from django.utils.translation import gettext as _

from app.forms.bill_templates import CreateBillTemplatForm, EditBillTemplateForm
from app.models.BillTemplate import BillTemplate
from app.models.Country import Country
from app.shortcuts import get_object_or_404


class BillTemplateListView(View):
    def get(self: BillTemplateListView, request: WSGIRequest) -> HttpResponse:
        templates = BillTemplate.objects.all()

        countries = Country.objects.all()

        context = {
            "countries": countries,
            "create_form": CreateBillTemplatForm(request.user),
            "templates": templates,
        }

        return render(request, "bill_templates/bill_templates.html", context)

    def post(self: BillTemplateListView, request: WSGIRequest) -> JsonResponse:

        form = CreateBillTemplatForm(request.user, request.POST)

        if form.is_valid() is False:
            errors = {
                "form_errors": form.errors
            }
            return JsonResponse(errors, status=400)

        try:
            with transaction.atomic():
                bill_template = form.save(commit=False)
                bill_template.user = request.user
                bill_template.save()
        except Exception as exception:
            transaction.rollback()
            return HttpResponse(_("An error occured"), status=500)

        return JsonResponse(model_to_dict(bill_template), status=400)

class BillTemplateDetailView(View):
    def get(self: BillTemplateDetailView, request: WSGIRequest, template_id: int) -> JsonResponse:
        template = cast(BillTemplate, get_object_or_404(
            BillTemplate, pk=template_id, user=request.user.pk,
            error_message=_("This template does not exist"),
            select_related=["brand", "group", "address", "address__country"]
        ))

        return JsonResponse(template.to_dict(include_brand=True, include_address=True, include_group=True))
        

    def put(self: BillTemplateDetailView, request: WSGIRequest, template_id: int) -> JsonResponse:
        template = cast(BillTemplate, get_object_or_404(
            BillTemplate, pk=template_id, user=request.user.pk,
            error_message=_("This template does not exist"),
            select_related=["brand", "group", "address", "address__country"]
        ))

        data = QueryDict(request.body)

        form = EditBillTemplateForm(request.user, data, instance=template)
        if form.is_valid() is False:
            errors = {
                "form_errors": form.errors
            }
            return JsonResponse(errors, status=400)

        try:
            with transaction.atomic():
                bill_template = form.save(commit=False)
                bill_template.user = request.user
                bill_template.save()
        except Exception as exception:
            transaction.rollback()
            return HttpResponse(_("An error occured", status=500))

        return JsonResponse(template.to_dict(include_brand=True, include_address=True, include_group=True))

    def delete(self: BillTemplateDetailView, request: WSGIRequest, template_id: int) -> HttpResponse:
        pass

