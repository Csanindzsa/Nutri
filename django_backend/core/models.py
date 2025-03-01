from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, is_active=True,
                          is_supervisor=True, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Creates and returns a superuser with admin privileges."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    is_supervisor = models.BooleanField(default=False)

    date_joined = models.DateTimeField(auto_now_add=True)
    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

    class Meta:
        db_table = "Users"


class Restaurant(models.Model):
    name = models.CharField(max_length=255, unique=True)
    foods_on_menu = models.IntegerField(default=0)  # Optional
    # Default placeholder image
    image = models.CharField(
        max_length=255, default="https://via.placeholder.com/150")

    def __str__(self):
        return self.name

    class Meta:
        db_table = "Restaurants"


class Location(models.Model):
    longitude = models.FloatField(default=0.0)  # Default value of 0.0
    latitude = models.FloatField(default=0.0)   # Default value of 0.0
    restaurants = models.ManyToManyField(Restaurant, related_name="locations")

    class Meta:
        db_table = "Locations"


# class ExactLocation(models.Model):
#     city_name = models.CharField(max_length=255)
#     postal_code = models.CharField(max_length=20)
#     street_name = models.CharField(max_length=255)
#     street_type = models.CharField(max_length=50)
#     house_number = models.IntegerField()
#     restaurant = models.ForeignKey(
#         Restaurant, on_delete=models.CASCADE, related_name="exact_locations")

#     class Meta:
#         db_table = "ExactLocations"


class Ingredient(models.Model):
    HAZARD_LEVEL_CHOICES = [
        (0, "Safe"),
        (1, "Mild Risk"),
        (2, "Moderate Risk"),
        (3, "High Risk"),
    ]

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    hazard_level = models.IntegerField(choices=HAZARD_LEVEL_CHOICES, default=0)

    def __str__(self):
        return self.name

    class Meta:
        db_table = "Ingredients"


class Food(models.Model):
    restaurant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name="foods")
    name = models.CharField(max_length=255, unique=True)
    macro_table = models.JSONField(default=dict)  # Stores macros as JSON
    # calories = models.IntegerField()
    serving_size = models.IntegerField(default=100)  # 100 grams
    is_organic = models.BooleanField(default=False)
    is_gluten_free = models.BooleanField(default=False)
    is_alcohol_free = models.BooleanField(default=False)
    is_lactose_free = models.BooleanField(default=False)
    image = models.ImageField(upload_to='food_images/', blank=True, null=True)
    ingredients = models.ManyToManyField(
        Ingredient, related_name="foods")  # Many-to-Many Relationship

    approved_supervisors = models.ManyToManyField(
        User, related_name="approved_foods", blank=True)
    is_approved = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.restaurant.name})"

    class Meta:
        db_table = "Foods"


class FoodChange(models.Model):
    old_version = models.ForeignKey(
        Food, on_delete=models.SET_NULL, related_name="new_versions", null=True, blank=True)
    is_deletion = models.BooleanField(default=False)

    new_restaurant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name="new_food_versions")
    new_name = models.CharField(max_length=255)
    new_macro_table = models.JSONField(default=dict)  # Stores macros as JSON
    # new_calories = models.IntegerField()
    new_serving_size = models.IntegerField(default=100)  # 100 grams
    new_is_organic = models.BooleanField(default=False)
    new_is_gluten_free = models.BooleanField(default=False)
    new_is_alcohol_free = models.BooleanField(default=False)
    new_is_lactose_free = models.BooleanField(default=False)
    new_image = models.ImageField(
        upload_to='food_images/', blank=True, null=True)
    new_ingredients = models.ManyToManyField(
        Ingredient, related_name="new_food_versions")  # Many-to-Many Relationship

    new_approved_supervisors = models.ManyToManyField(
        User, related_name="approved_food_changes", blank=True)
    new_is_approved = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.new_name} ({self.new_restaurant.name})"

    class Meta:
        db_table = "FoodChanges"


class ConfirmationToken(models.Model):
    code = models.CharField(max_length=32)
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="confirmation_codes")

    class Meta:
        db_table = "ConfirmationTokens"
