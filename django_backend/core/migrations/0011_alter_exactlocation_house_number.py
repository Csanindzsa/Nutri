# Generated by Django 5.1.1 on 2025-02-12 09:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_exactlocation_location'),
    ]

    operations = [
        migrations.AlterField(
            model_name='exactlocation',
            name='house_number',
            field=models.IntegerField(),
        ),
    ]
