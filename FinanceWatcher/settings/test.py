from FinanceWatcher.settings.base import *

DEBUG = True

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswortHasher'
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:'
    }
}