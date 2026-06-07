from typing import cast

from django.http.request import QueryDict
from django.template.defaultfilters import register
from django.core.handlers.wsgi import WSGIRequest

@register.filter
def get_sorting_icon(query: QueryDict[str, str], name: str) -> str:
    if "sort" not in query:
        if name == "date":
            return "fa-sort-down"
        return ""
    
    sorting = cast(str, query["sort"])

    if name not in sorting:
        return ""
    
    return "fa-sort-down" if sorting.startswith("-") else "fa-sort-up"

@register.simple_tag
def get_sorting_url(request: WSGIRequest, name: str) -> str:
    data = request.GET.copy() if request.method == "GET" else request.POST.copy()
    
    if "sort" not in data or name not in data["sort"]:
        data["sort"] = f"-{name}"
    else:
        data["sort"] = name if data["sort"].startswith("-") else f"-{name}"

    query_string = "&".join([f"{key}={value}" for key, value in data.items()])

    return f"{request.path}?{query_string}"

@register.simple_tag
def get_pagination_url(request: WSGIRequest, page_index: int) -> str:
    data = request.GET.copy() if request.method == "GET" else request.POST.copy()
    
    data["page"] = page_index

    query_string = "&".join([f"{key}={value}" for key, value in data.items()])

    return f"{request.path}?{query_string}"