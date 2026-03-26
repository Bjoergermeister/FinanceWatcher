export $(cat .application.env | grep ^[^#] | xargs)

mkdir -p db_backup

date=$(date +%Y-%m-%d-%H-%M-%S)
docker exec -t $DB_HOST pg_dump --format=custom --dbname $DB_NAME --user=$DB_USER --file=/tmp/db_backup_$date.dump
docker cp $DB_HOST:/tmp/db_backup_$date.dump ./db_backup