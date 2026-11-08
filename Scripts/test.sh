source env/bin/activate

export $(cat .application.env | grep ^[^#] | xargs)

coverage run manage.py test --settings FinanceWatcher.settings.test app.test -v 2
coverage report -m