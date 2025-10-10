class HttpException(Exception):
    """
    Basisklasse für HTTP-Ausnahmefehler.
    """
    status_code = 500
    message = "An error occurred."
    as_json = True

    def __init__(self, message=None, as_json=False):
        if message:
            self.message = message
        self.as_json = as_json
        super().__init__(self.message)


class HttpNotFoundException(HttpException):
    """Exception raised for HTTP 404 Not Found errors."""
    status_code = 404


class HttpBadRequestException(HttpException):
    """Exception raised for HTTP 400 Bad Request errors."""
    status_code = 400
