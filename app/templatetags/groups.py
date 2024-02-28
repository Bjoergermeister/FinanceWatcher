from ast import List

from django.db.models.query import QuerySet
from django.template.defaultfilters import register

@register.filter
def filter_by_group(forms: List, group_id: int):
    result = []
    for form in forms:
        if form.initial["group"] == group_id:
            result.append(form)
    return result
    return [form for form in forms if form.initial["group"] is group_id]