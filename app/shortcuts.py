"""
Custom versions of Django's shortcut functions.
"""

from typing import (
    Any,
    cast,
    Type
)

from django.db.models import Model, QuerySet

from .exceptions import HttpNotFoundException


def get_object_or_404(klass: Type[Model], *args, **kwargs) -> Model:
    """
    Use get() to return an object, or raise an Http404 exception if the object
    does not exist.

    klass may be a Model, Manager, or QuerySet object. All other passed
    arguments and keyword arguments are used in the get() query.

    Like with QuerySet.get(), MultipleObjectsReturned is raised if more than
    one object is found.
    """
    error_message = cast(str, kwargs.pop("error_message", ""))
    json = cast(bool, kwargs.pop("json", False))

    queryset = _get_queryset(klass)
    if not hasattr(queryset, "get"):
        klass__name = (
            klass.__name__ if isinstance(klass, type) else klass.__class__.__name__
        )
        raise ValueError(
            f"First argument to get_object_or_404() must be a Model, Manager, "
            f"or QuerySet, not '{klass__name}'."
        )
    try:
        return queryset.get(*args, **kwargs)
    except queryset.model.DoesNotExist as exception:
        if error_message is None:
            error_message = f"No {queryset.model._meta.object_name} matches the given query."

        raise HttpNotFoundException(error_message, as_json=json) from exception


def _get_queryset(klass: Type[Model]) -> QuerySet[Any, Any] | Type[Model]:
    """
    Return a QuerySet or a Manager.
    Duck typing in action: any class with a `get()` method (for
    get_object_or_404) or a `filter()` method (for get_list_or_404) might do
    the job.
    """
    # If it is a model class or anything else with ._default_manager
    if hasattr(klass, "_default_manager"):
        return klass._default_manager.all()
    return klass
