from django.contrib import admin
from .models import User, Restaurant, Food, Ingredient
# Register your models here.
admin.site.register(User)
admin.site.register(Restaurant)
admin.site.register(Food)
admin.site.register(Ingredient)