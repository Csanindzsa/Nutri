# Generated by Django 5.1.1 on 2025-03-06 12:47

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0034_alter_food_name_alter_food_unique_together'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='food',
            unique_together=set(),
        ),
    ]
