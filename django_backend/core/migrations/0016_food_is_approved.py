# Generated by Django 5.1.1 on 2025-02-16 13:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0015_remove_food_is_approved'),
    ]

    operations = [
        migrations.AddField(
            model_name='food',
            name='is_approved',
            field=models.BooleanField(default=True),
        ),
    ]
