"""
URL configuration for FinanceWatcher project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path

from app.views import dashboard, addresses, bills, groups, brands

urlpatterns = [
    path('', dashboard.dashboard, name="dashboard"),

    path("admin/", admin.site.urls),
    path("bills", bills.bills, name="bills"),
    path("bill/new", bills.CreateBillView.as_view(), name="create_bill"),
    path("bill/<int:bill_id>", bills.EditBillView.as_view(), name="edit_bill"),
    path("bill/<int:bill_id>/preview", bills.preview, name="preview_bill"),

    path("groups", groups.GroupsView.as_view(), name="groups"),
    path("group/<int:group_id>", groups.EditGroupView.as_view(), name="edit_group"),

    path("brands", brands.BrandListView.as_view(), name="brands"),
    path("brands/search", brands.search, name="search_brands"),
    path("brands/<int:brand_id>", brands.BrandDetailView.as_view(), name="brand_details"),
    path("brands/<int:brand_id>/addresses", brands.BrandAddressesListView.as_view(), name="brand_addresses"),
    path("brands/<int:brand_id>/assign-addresses", brands.assign_addresses, name="assign_addresses"),
    path("brands/<int:brand_id>/unassign-address", brands.unassign_address, name="unassign_address"),
    path("brands/<int:brand_id>/delete-address", brands.delete_address, name="delete_address"),
    path("brands/edit-brand-address/<int:brand_address_id>", brands.update_address, name="edit-brand-address-association"),

    path("addresses", addresses.get_all, name="addresses"),
    path("address", addresses.create, name="create_address"),
    path("addresses/search", addresses.search, name="search_addresses"),
    path("address/<int:address_id>", addresses.EditAddress.as_view(), name="edit_address"),

    # API Endpoints
    path("api/groups", groups.list_all, name="all_groups"),
    path("api/brands", brands.get_all, name="all_brands"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)