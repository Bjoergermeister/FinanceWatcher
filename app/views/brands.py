from __future__ import annotations

from datetime import date, timedelta

from django.core.handlers.wsgi import WSGIRequest
from django.forms.models import model_to_dict
from django.http import (
    JsonResponse,
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseNotFound
)
from django.shortcuts import render
from django.views import View

from app.enums import Http
from app.forms.brands import CreateBrandForm, EditBrandForm, EditAddressAssociationForm

from app.models.Brand import Brand
from app.models.BrandAddress import BrandAddress
from app.models.Country import Country

from app.shortcuts import get_object_or_404


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
    
class BrandAddressesListView(View):
    def get(self: BrandAddressesListView, request: WSGIRequest, brand_id: int) -> HttpResponse:
        try:
            brand = Brand.objects.get(pk=brand_id)
        except Brand.DoesNotExist:
            return HttpResponseNotFound(f"Es gibt keine Marke mit der ID f{brand_id}")
        
        countries = Country.objects.all()
        brand_address_associations = BrandAddress.objects.filter(brand=brand).select_related("address")

        context = {
            "brand": brand,
            "brand_address_associations": brand_address_associations,
            "edit_address_association_form": EditAddressAssociationForm(),
            "countries": countries
        }

        return render(request, "brands/addresses.html", context)
    

def assign_addresses(request: WSGIRequest, brand_id: int) -> HttpResponse:
    brand: Brand = get_object_or_404(Brand, pk=brand_id, json=True)

    address_ids = request.POST.getlist("addresses")

    # Since the addresses can be in use, make sure that the end date is properly set
    yesterday = date.today() - timedelta(days=1)
    BrandAddress.objects.filter(address__in=address_ids).update(end_date=yesterday)

    # Create new mappings between addresses and the brand starting from today
    new_address_associations = (
        BrandAddress(
            brand=brand,
            address_id=address_id,
            start_date=date.today()
        )
        for address_id
        in address_ids
    )
    created_db_objects = BrandAddress.objects.bulk_create(new_address_associations)

    addresses = BrandAddress.objects.filter(
        pk__in=[address.pk for address in created_db_objects]
    ).select_related("address")
    
    response = {
        "brand": brand.to_json(),
        "addresses": [
            address.to_json(include_brand=False)
            for address
            in addresses
        ]
    }

    return JsonResponse(response, safe=False, status=Http.CREATED)


def unassign_address(request: WSGIRequest, brand_id: int) -> HttpResponse:
    """
    Unassigns an address from a brand. Only works if the address is currently assigned to the brand
    (no end date is specified)
    
    :param request: Description
    :type request: WSGIRequest
    :param brand_id: Description
    :type brand_id: int
    :return: Description
    :rtype: HttpResponse
    """
    brand: Brand = get_object_or_404(Brand, pk=brand_id, json=True)

    brand_address_id = request.GET.get("address", None)

    if brand_address_id is None:
        return HttpResponseBadRequest("ID der Addresse benötigt")
    
    brand_address: BrandAddress = get_object_or_404(BrandAddress, pk=brand_address_id, json=True)
    if brand_address.brand_id != brand.pk:
        return HttpResponseBadRequest(f"Addresse gehört nicht zu {brand.name}")

    brand_address.end_date = date.today() - timedelta(days=1)
    brand_address.save()

    return JsonResponse(brand_address.to_json())

def delete_address(request: WSGIRequest, brand_id: int) -> HttpResponse:
    """
    Deletes the association between the brand and the address
    This can be used if an address was mistakenly assigned to a brand.
    
    :param request: Description
    :type request: WSGIRequest
    :param brand_id: Description
    :type brand_id: int
    :return: Description
    :rtype: HttpResponse
    """
    brand: Brand = get_object_or_404(Brand, pk=brand_id, json=True)

    brand_address_id = request.GET.get("address", None)

    if brand_address_id is None:
        return HttpResponseBadRequest("ID der Addresse benötigt")
    
    brand_address: BrandAddress = get_object_or_404(BrandAddress, pk=brand_address_id, json=True)
    if brand_address.brand_id != brand.pk:
        return HttpResponseBadRequest(f"Addresse gehört nicht zu {brand.name}")

    brand_address.delete()

    return HttpResponse()

def update_address(request: WSGIRequest, brand_address_id) -> HttpResponse:
    brand_address: BrandAddress = get_object_or_404(
        BrandAddress,
        pk=brand_address_id,
        error_message="Address association does not exist",
        json=True
    )

    edit_address_association_form = EditAddressAssociationForm(request.POST)

    if edit_address_association_form.is_valid() == False:
        return JsonResponse(edit_address_association_form.errors, status=Http.BAD_REQUEST)
    
    start_date = edit_address_association_form.cleaned_data.get("start_date")
    end_date = edit_address_association_form.cleaned_data.get("end_date")
    brand_address.start_date = start_date
    brand_address.end_date = end_date
    brand_address.save()

    json_response = brand_address.to_json(include_brand=False, include_id=False)    

    return JsonResponse(json_response)

def search(request: WSGIRequest) -> JsonResponse:
    query = request.GET.get("query", None)

    if query is None:
        return HttpResponseBadRequest("Query parameter missing")
    
    brands = Brand.objects.filter(name__icontains=query).order_by("name").only("name", "icon")
    return JsonResponse([brand.to_json() for brand in brands], safe=False)