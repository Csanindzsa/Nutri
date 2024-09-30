from django.db import models
from django.contrib.auth.models import User, AbstractUser

# Create your models here.
class Product(models.Model):
    Name = models.CharField(max_length=255)
    Description = models.TextField()
    Ingredient_table = models.JSONField()



class Ingredient(models.Model):
    short_name = models.CharField(max_length=64)
    Description = models.TextField()
    class SafetyChoices(models.IntegerChoices):
        completely_safe = 0,
        moderate_risk = 1, 
        high_risk = 2,
        no_data = 3 
    Safety_level = models.IntegerChoices("SafetyChoices", names="enum")

class FoodShop(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    used_products = models.ManyToManyField(Product)

    open_hours = models.TimeField()
    closing_hours = models.TimeField()


class User(AbstractUser):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=255)
    class PlanChoices(models.IntegerChoices):
        free = 0, "Free plan"
        base_tier = 1, "Base tier"
        medium_tier = 2, "Medium tier"
        high_tier = 3, "VIP plan"

    subscription_plan = models.IntegerField(choices=PlanChoices.choices, default=PlanChoices.free) #, default=0?
    product_history = models.ManyToManyField(Product)
    ingredient_history = models.ManyToManyField(Ingredient)

    favorite_foods = models.ManyToManyField(Product, related_name="liked_by")

    favourite_shops = models.ManyToManyField(FoodShop, related_name="liked_by")

    class DietChoices(models.IntegerChoices):
        Normal = 0, "Average diet"
        Vegan = 1, "No meat"
        Vegetarian = 2, "No animal products"
        Keto = 3, "no carbs"
        Paleo = 4, "no new things"
        Carnivore = 5, "nothing apart from meat"

    diet_type = models.IntegerField(choices=DietChoices, default=DietChoices.Normal) #Normal, Vegan, Vegetarian, Keto, Paleo, Carnivore

    
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ("username",)
