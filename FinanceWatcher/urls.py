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

from app.views import bills, groups

urlpatterns = [
    path("", bills.bills, name="bills"),
    path("admin/", admin.site.urls),
    path("bill/new", bills.create, name="create_bill"),
    path("bill/<int:id>", bills.edit, name="edit_bill"),
    path("bill/<int:id>/delete", bills.delete, name="delete_bill"),
    path("bill/<int:bill_id>/position/<int:position_id>/delete", bills.delete_position, name="delete_position"),

    path("groups", groups.groups, name="groups"),
    path("group/new", groups.create, name="create_group")
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)