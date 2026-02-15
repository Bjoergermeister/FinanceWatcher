import logging

from datetime import date, datetime

from django.http import HttpRequest
from django.http.request import QueryDict

from app.exceptions import HttpBadRequestException

logger = logging.getLogger(__name__)

def get_date_from_request(request: HttpRequest, key: str, default: date | None = None) -> date | None:
    request_data = get_data_from_request(request)

    value = request_data.get(key, None)

    if value is None:
        return default
    
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except Exception as exception:
        logger.error(f"{value} is not a valid format (yyyy-mm-dd)", exc_info=exception)
        raise HttpBadRequestException(f"{value} is not a valid date format (yyyy-mm-dd)")

def get_date_from_request_or_bad_request(request: HttpRequest, key: str) -> date:
    date = get_date_from_request(request, key)

    if date is None:
        raise HttpBadRequestException(f"{key} is missing")
    
    return date

# Helper methods
def get_data_from_request(request: HttpRequest) -> QueryDict:
    if len(request.GET) > 0:
        return request.GET
    
    return request.POST
