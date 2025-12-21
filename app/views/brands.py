from __future__ import annotations

from django.core.handlers.wsgi import WSGIRequest
from django.forms.models import model_to_dict
from django.http import JsonResponse, HttpResponse, HttpResponseNotFound, QueryDict
from django.shortcuts import render
from django.views import View

from app.enums import Http
from app.forms.brands import CreateBrandForm, EditBrandForm
from app.models.Brand import Brand


def get_all(self: WSGIRequest) -> JsonResponse:
    brands = Brand.objects.order_by("name")
    return JsonResponse({"brands": list(brands)})


class BrandListView(View):
    def get(self: BrandListView, request: WSGIRequest):
        """
        Renders a list with all brands known in the system
        
        :param self: Description
        :type self: BrandListView
        :param request: Description
        :type request: WSGIRequest
        """

        brands = Brand.objects.order_by("name")

        create_brand_form = CreateBrandForm()

        context = {
            "brands": brands,
            "create_brand_form": create_brand_form
        }

        return render(request, "brands/brands.html", context)

    def post(self: BrandListView, request: WSGIRequest):
        """
        Creates a new brand
        
        :param self: Description
        :type self: BrandListView
        :param request: Description
        :type request: WSGIRequest
        """
        create_brand_form = CreateBrandForm(request.POST, request.FILES)

        if create_brand_form.is_valid() is False:
            errors = {
                "form": create_brand_form.errors
            }
            return JsonResponse(errors, status=Http.BAD_REQUEST)
        
        new_brand: Brand = create_brand_form.save(commit=False)
        new_brand.save(file_was_uploaded="icon" in request.FILES)

        brand_dict = model_to_dict(new_brand, exclude=["icon"])
        brand_dict["icon"] = new_brand.get_icon_url()
        return JsonResponse(brand_dict)
    
class BrandDetailView(View):
    def get(self: BrandDetailView, request: WSGIRequest, brand_id: int):
        try:
            brand = Brand.objects.get(id=brand_id)
        except Brand.DoesNotExist:
            return HttpResponseNotFound(f"Es existiert keine Marke mit der ID {brand_id}")
        
        return JsonResponse(brand.to_json())

    def post(self: BrandDetailView, request: WSGIRequest, brand_id: int):
        try:
            brand = Brand.objects.get(id=brand_id)
        except Brand.DoesNotExist:
            return HttpResponseNotFound(f"Es existert keine Marke mit der ID {brand_id}")

        edit_brand_form = EditBrandForm(request.POST, request.FILES, instance=brand)
        if edit_brand_form.is_valid() is False:
            errors = {
                "form": edit_brand_form.errors
            }
            return JsonResponse(errors, status=Http.BAD_REQUEST)
        
        edited_brand: Brand = edit_brand_form.save(commit=False)
        edited_brand.save(file_was_uploaded="icon" in request.FILES)

        return JsonResponse(edited_brand.to_json())

    def delete(self: BrandDetailView, request: WSGIRequest, brand_id: int) -> HttpResponse:
        try:
            brand = Brand.objects.get(id=brand_id)
        except Brand.DoesNotExist:
            return HttpResponseNotFound(f"Es existiert keine Marke mit der ID {brand_id}")
        
        brand.delete()

        return HttpResponse()
