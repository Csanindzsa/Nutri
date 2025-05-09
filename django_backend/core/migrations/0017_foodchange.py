# Generated by Django 5.1.1 on 2025-02-16 14:01

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_food_is_approved'),
    ]

    operations = [
        migrations.CreateModel(
            name='FoodChange',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('new_name', models.CharField(max_length=255, unique=True)),
                ('new_macro_table', models.JSONField(default=dict)),
                ('new_is_organic', models.BooleanField(default=False)),
                ('new_is_gluten_free', models.BooleanField(default=False)),
                ('new_is_alcohol_free', models.BooleanField(default=False)),
                ('new_is_lactose_free', models.BooleanField(default=False)),
                ('new_image', models.ImageField(blank=True, null=True, upload_to='food_images/')),
                ('new_is_approved', models.BooleanField(default=True)),
                ('new_approved_supervisors', models.ManyToManyField(blank=True, related_name='approved_food_changes', to=settings.AUTH_USER_MODEL)),
                ('new_ingredients', models.ManyToManyField(related_name='new_food_versions', to='core.ingredient')),
                ('new_restaurant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='new_food_versions', to='core.restaurant')),
                ('old_version', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='new_versions', to='core.food')),
            ],
            options={
                'db_table': 'FoodChanges',
            },
        ),
    ]
