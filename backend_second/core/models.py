from django.db import models
from django.contrib.auth.models import User, AbstractUser
from nutrition_section.models import Product, Ingredient

# Create your models here.

class User(AbstractUser):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=255)
    class PlanChoices(models.IntegerChoices):
        free = 0, "Free plan"
        base_tier = 1, "Base tier"
        medium_tier = 2, "Medium tier"
        high_tier = 3, "VIP plan"

    subscription_plan = models.IntegerField(choices=PlanChoices.choices, default=PlanChoices.free) #, default=0?
    product_history = models.ManyToManyField("nutrition_section.Product", related_name="viewed_by")
    ingredient_history = models.ManyToManyField("nutrition_section.Ingredient", related_name="viewed_by")

    favorite_foods = models.ManyToManyField("nutrition_section.Product", related_name="liked_by")

    favourite_shops = models.ManyToManyField("shop_section.FoodShop", related_name="liked_by")

    class DietChoices(models.IntegerChoices):
        Normal = 0, "Average diet"
        Vegan = 1, "No meat"
        Vegetarian = 2, "No animal products"
        Keto = 3, "no carbs"
        Paleo = 4, "no things younger than 10 thousand years"
        Carnivore = 5, "nothing apart from meat"

    diet_type = models.IntegerField(choices=DietChoices.choices, default=DietChoices.Normal) #Normal, Vegan, Vegetarian, Keto, Paleo, Carnivore

    
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ("username",)
