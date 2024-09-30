from django.db import models
from django.core.exceptions import ValidationError

# Create your models here.
class Ingredient(models.Model):
    Short_name = models.CharField(max_length=255)
    Description = models.TextField()
    
    class SafetyChoices(models.IntegerChoices):
        completely_safe = 0,
        moderate_risk = 1, 
        high_risk = 2,
        no_data = 3 

    Safety_level = models.IntegerField(choices=SafetyChoices.choices, default=SafetyChoices.no_data)

    def __str__(self):
        return self.Short_name


class Product(models.Model):
    Name = models.CharField(max_length=255)
    General_description = models.TextField()
    # Ingredient_list = models.ManyToManyField("Ingredient", related_name="used_in_products")  # This will contain ingredient keys as JSON
    Macro_table = models.JSONField()

