from django.test import TransactionTestCase

from app.models.User import User

test_user = None

class FinanceWatcherTestCase(TransactionTestCase):
    def setUp(self):
        global test_user

        super().setUp()

        test_user = User.objects.create(
            username="johndoe",
            first_name="john",
            last_name="doe",
            email="john.doe@mail.com"
        )

def get_test_user() -> User:
    return test_user

