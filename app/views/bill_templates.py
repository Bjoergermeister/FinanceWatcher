from __future__ import annotations

from django.core.handlers.wsgi import WSGIRequest
from django.http import HttpResponse
from django.shortcuts import render
from django.views import View

from app.forms.bill_templates import CreateBillTemplatForm
from app.models.BillTemplate import BillTemplate


class BillTemplateListView(View):
    def get(self: BillTemplateListView, request: WSGIRequest) -> HttpResponse:
        templates = BillTemplate.objects.all()

        context = {
            "templates": templates,
            "create_form": CreateBillTemplatForm()
        }

        return render(request, "bill_templates/bill_templates.html", context)
