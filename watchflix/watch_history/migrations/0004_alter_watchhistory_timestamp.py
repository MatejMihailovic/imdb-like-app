# Generated by Django 5.1.1 on 2024-09-21 16:01

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('watch_history', '0003_alter_watchhistory_rating'),
    ]

    operations = [
        migrations.AlterField(
            model_name='watchhistory',
            name='timestamp',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
    ]
