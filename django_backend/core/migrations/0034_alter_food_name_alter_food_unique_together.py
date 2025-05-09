# Generated by Django 5.1.1 on 2025-03-06 12:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0033_food_created_date_foodchange_new_hazard_level_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='food',
            name='name',
            field=models.CharField(max_length=255),
        ),
        migrations.AlterUniqueTogether(
            name='food',
            unique_together={('restaurant', 'name')},
        ),
    ]
