from django.core.handlers.wsgi import WSGIRequest
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views import View

from app.enums import Http
from app.forms.addresses import CreateAddressForm
from app.models.Address import Address
from app.models.BrandAddress import BrandAddress


def get_all(request: WSGIRequest) -> HttpResponse:
    addresses = Address.objects.order_by("-pk")
    create_address_form = CreateAddressForm()

    context = {
        "addresses": addresses,
        "create_address_form": create_address_form,
    }

    return render(request, "addresses/addresses.html", context)


def create(request: WSGIRequest) -> HttpResponse:
    form = CreateAddressForm(request.POST)

    if form.is_valid() is False:
        return JsonResponse({ "error": form.errors }, status=400)

    instance: Address = form.save()

    return JsonResponse(instance.to_dict(), status=Http.CREATED)

class EditAddress(View):
    def get(self, request: WSGIRequest, address_id: int) -> HttpResponse:
        try:
            address = Address.objects.get(id=address_id)
        except Address.DoesNotExist:
            return HttpResponse(status=404)
        
        data = {
            "id": address.id,
            "country": address.country.id,
            "region": address.region,
            "city": address.city,
            "street": address.street,
            "number": address.number,
            "additional_info": address.additional_info,
            "postal_code": address.postal_code,
        }

        return JsonResponse(data, status=200)

    def post(self, request: WSGIRequest, address_id: int) -> HttpResponse:
        try:
            address = Address.objects.select_related("country").get(id=address_id)
        except Address.DoesNotExist:
            return HttpResponse(status=404)
        
        form = CreateAddressForm(request.POST, instance=address)

        if form.is_valid() is False:
            return JsonResponse({ "error": form.errors }, status=400)

        instance: Address = form.save()

        return JsonResponse(instance.to_dict(), status=200)


    def delete(self, request: WSGIRequest, address_id: int) -> HttpResponse:
        try:
            address = Address.objects.get(id=address_id)
        except Address.DoesNotExist:
            return HttpResponse(status=404)
        
        address = Address.objects.get(id=address_id)
        address.delete()
        return HttpResponse(status=204)
    

def search(request: WSGIRequest) -> JsonResponse:
    exclude = request.GET.get("exclude", None)
    brand = request.GET.get("brand", None)
    country = request.GET.get("country", None)
    city = request.GET.get("city", None)
    region = request.GET.get("region", None)
    postal_code = request.GET.get("postal_code", None)

    addresses = Address.objects.all()

    if exclude is not None:
        brand_addresses_ids = BrandAddress.objects.filter(brand=exclude).only("pk").values_list("address_id", flat=True)
        addresses = addresses.exclude(pk__in=brand_addresses_ids)

    if brand is not None:
        addresses = addresses.filter(brand=brand)

    if country is not None:
        addresses = addresses.filter(country=country)

    if city is not None:
        addresses = addresses.filter(city=city)

    if region is not None:
        addresses = addresses.filter(region=region)
    if postal_code is not None:
        addresses = addresses.filter(postal_code=postal_code)

    return JsonResponse(list(addresses.values()), safe=False)