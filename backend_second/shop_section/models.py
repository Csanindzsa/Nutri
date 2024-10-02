from django.db import models

# Create your models here.



class FoodShop(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    sold_products = models.ManyToManyField("nutrition_section.Product", related_name="sold_at")
    Url = models.CharField(max_length=2048, null=True) #that's the max allowed
    Google_Maps_Url = models.CharField(max_length=2048, null=True)

    open_hours = models.TimeField()
    closing_hours = models.TimeField()