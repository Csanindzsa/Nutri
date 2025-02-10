from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class CustomUserManager(BaseUserManager):
    """Custom manager for CustomUser model"""

    def create_user(self, email, password=None, **extra_fields):
        """Creates and returns a regular user with an email and password."""
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Creates and returns a superuser with admin privileges."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model that uses email instead of username."""
    
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email


from django.db import models
class Restaurant(models.Model):
    """Model representing a restaurant"""
    name = models.CharField(max_length=255, unique=True)
    foods_on_menu = models.CharField(max_length=255, blank=True, null=True)  # Optional

    def __str__(self):
        return self.name


class Ingredient(models.Model):
    """Model representing an ingredient with hazard levels"""
    
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


class Food(models.Model):
    """Model representing a food item in a restaurant"""
    
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name="foods")
    name = models.CharField(max_length=255)
    macro_table = models.JSONField(default=dict)  # Stores macros as JSON
    is_organic = models.BooleanField(default=False)
    is_gluten_free = models.BooleanField(default=False)
    is_alcohol_free = models.BooleanField(default=False)
    is_lactose_free = models.BooleanField(default=False)

    ingredients = models.ManyToManyField(Ingredient, related_name="foods")  # Many-to-Many Relationship

    def __str__(self):
        return f"{self.name} ({self.restaurant.name})"


class ConfirmationToken(models.Model):
    code = models.CharField(max_length=32)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name="confirmation_codes")