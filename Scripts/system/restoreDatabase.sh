export $(cat .application.env | grep ^[^#] | xargs)

timestamp=$1

if [ -z "$2" ]; then
    dbname=$DB_NAME
else
    dbname=$2
fi

docker cp ./db_backup/db_backup_$timestamp.dump $DB_HOST:/tmp/db_backup_$timestamp.dump

docker exec $DB_HOST psql -U admin --dbname postgres -c "DROP ROLE IF EXISTS $DB_USER;"
docker exec $DB_HOST psql -U admin --dbname postgres -c "CREATE ROLE $DB_USER WITH LOGIN BYPASSRLS PASSWORD '$DB_PASSWORD';"

docker exec $DB_HOST dropdb -U admin --if-exists --maintenance-db=postgres $DB_NAME
docker exec $DB_HOST createdb -U admin --maintenance-db=postgres $DB_NAME --owner $DB_USER

docker exec $DB_HOST pg_restore --format=custom --dbname=$dbname --user=$DB_USER /tmp/db_backup_$timestamp.dump
docker exec $DB_HOST rm -rf /tmp/db_backup_$timestamp.dump0