from django.db import models
from django.contrib.auth.models import User, AbstractBaseUser, AbstractUser

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
        free = 0,
        base_tier = 1, 
        medium_tier = 2,
        high_tier = 3

    subscription_plan = models.IntegerChoices("PlanChoices", names="enum")
    product_history = models.ManyToManyField(Product)
    ingredient_history = models.ManyToManyField(Ingredient)

    favorite_foods = models.ManyToManyField(Product, related_name="liked_by")

    favourite_shops = models.ManyToManyField(FoodShop, related_name="liked_by")

    class DietChoices(models.IntegerChoices):
        Normal = 0,
        Vegan = 1, 
        Vegetarian = 2,
        Keto = 3,
        Paleo = 4,
        Carnivore = 5,

    diet_type = models.IntegerChoices("DietChoices", names="enum") #Normal, Vegan, Vegetarian, Keto, Paleo, Carnivore

    
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ("username",)
