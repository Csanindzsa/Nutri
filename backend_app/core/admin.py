from django.contrib import admin
from . import models
# Register your models here.
admin.site.register(models.User)
admin.site.register(models.Product)
admin.site.register(models.Ingredient)
admin.site.register(models.FoodShop)
