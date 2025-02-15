from typing import Any

from django.template.defaultfilters import register

@register.filter
def get_item(dictionary: dict[Any, Any], key: Any):
    if dictionary is None:
        return None
    
    return dictionary.get(key, None)