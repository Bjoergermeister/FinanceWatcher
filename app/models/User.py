import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(unique=True)
    first_name = models.CharField()
    last_name = models.CharField()
    email = models.CharField(unique=True)

    class Meta:
        db_table = "User"