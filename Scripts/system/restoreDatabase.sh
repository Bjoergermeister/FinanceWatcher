export $(cat .application.env | grep ^[^#] | xargs)

timestamp=$1

if [ -z "$2" ]; then
    dbname=$DB_NAME
else
    dbname=$2
fi

docker cp ./db_backup/db_backup_$timestamp.dump $DB_HOST:/tmp/db_backup_$timestamp.dump
docker exec -t financewatcher-database pg_restore --format=custom --dbname=$dbname --user=$DB_USER /tmp/db_backup_$timestamp.dump