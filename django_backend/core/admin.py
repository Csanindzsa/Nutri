from django.contrib import admin
from .models import *
from rest_framework_simplejwt.models import *
# Register your models here.
admin.site.register(User)
admin.site.register(Restaurant)
admin.site.register(Food)
admin.site.register(Ingredient)
admin.site.register(FoodChange)
admin.site.register(ConfirmationToken)