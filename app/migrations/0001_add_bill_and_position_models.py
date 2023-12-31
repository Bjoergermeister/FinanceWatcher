# Generated by Django 5.0 on 2023-12-20 23:36

import datetime
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Bill",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("user", models.UUIDField(db_column="user")),
                ("date", models.DateField(db_column="date")),
                (
                    "created",
                    models.DateField(db_column="created", default=datetime.date.today),
                ),
                (
                    "total",
                    models.DecimalField(
                        db_column="total", decimal_places=2, max_digits=13
                    ),
                ),
                (
                    "description",
                    models.TextField(blank=True, db_column="description", null=True),
                ),
                (
                    "receipt",
                    models.ImageField(
                        blank=True, db_column="receipt", null=True, upload_to=""
                    ),
                ),
            ],
            options={
                "db_table": "Bill",
                "managed": True,
            },
        ),
        migrations.CreateModel(
            name="Position",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(db_column="name", max_length=128)),
                (
                    "price",
                    models.DecimalField(
                        db_column="price", decimal_places=2, max_digits=13
                    ),
                ),
                (
                    "quantity",
                    models.DecimalField(
                        db_column="quantity", decimal_places=2, max_digits=13
                    ),
                ),
                ("note", models.TextField(blank=True, db_column="note", null=True)),
                (
                    "bill",
                    models.ForeignKey(
                        db_column="bill",
                        on_delete=django.db.models.deletion.CASCADE,
                        to="app.bill",
                    ),
                ),
            ],
            options={
                "db_table": "Position",
            },
        ),
    ]
