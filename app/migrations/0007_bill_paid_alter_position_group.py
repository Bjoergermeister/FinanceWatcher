# Generated by Django 5.0 on 2024-03-05 19:00

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("app", "0006_alter_position_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="bill",
            name="paid",
            field=models.BooleanField(blank=True, db_column="paid", default=True),
        ),
        migrations.AlterField(
            model_name="position",
            name="group",
            field=models.ForeignKey(
                blank=True,
                db_column="group",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="app.group",
            ),
        ),
    ]