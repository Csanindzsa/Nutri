from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.db.models import Avg
from django.utils import timezone


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
    # Use ImageField instead of CharField for better handling
    image = models.ImageField(upload_to='restaurant_images/',
                              null=True,
                              blank=True,
                              default="https://via.placeholder.com/150")
    cuisine = models.CharField(max_length=255, default="Unknown")
    description = models.TextField(blank=True, null=True)
    # Add hazard_level field to store the average hazard level of all foods
    hazard_level = models.FloatField(default=0)

    def __str__(self):
        return self.name

    class Meta:
        db_table = "Restaurants"

    def save(self, *args, **kwargs):
        # Only try to fetch an image for new restaurants without an image
        if not self.pk and (not self.image or str(self.image) == "https://via.placeholder.com/150") and self.name:
            # First, check if this restaurant already exists by name
            if not Restaurant.objects.filter(name__iexact=self.name).exists():
                # Only then try to fetch an image
                try:
                    from .utils.image_fetcher import fetch_restaurant_image
                    success, image_content = fetch_restaurant_image(
                        self.name, self.cuisine)
                    if success:
                        image_name = f"restaurant_{self.name.replace(' ', '_')}.jpg"
                        self.image.save(image_name, image_content, save=False)
                except (ImportError, Exception) as e:
                    pass  # Silently continue if image fetcher isn't available

        super().save(*args, **kwargs)


class Location(models.Model):
    longitude = models.FloatField(default=0.0)  # Default value of 0.0
    latitude = models.FloatField(default=0.0)   # Default value of 0.0

    # Replace ManyToMany with ForeignKey to establish OneToMany
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,  # When restaurant is deleted, delete its locations
        related_name="locations",   # Keep same related_name for backward compatibility
        null=True,  # Set to True temporarily for migration
        blank=True  # Also allow blank temporarily
    )

    def __str__(self):
        return f"{self.restaurant.name} at ({self.latitude:.4f}, {self.longitude:.4f})"

    class Meta:
        db_table = "Locations"
        indexes = [
            models.Index(fields=['latitude', 'longitude'])
        ]


class Ingredient(models.Model):
    HAZARD_LEVEL_CHOICES = [
        (0, "Safe"),
        (1, "Minimal Risk"),
        (2, "Mild Risk"),
        (3, "Moderate Risk"),
        (4, "High Risk"),
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
    name = models.CharField(max_length=255)  # No unique constraint
    macro_table = models.JSONField(default=dict)  # Stores macros as JSON
    serving_size = models.IntegerField(default=100)  # 100 grams
    is_organic = models.BooleanField(default=False)
    is_gluten_free = models.BooleanField(default=False)
    is_alcohol_free = models.BooleanField(default=False)
    is_lactose_free = models.BooleanField(default=False)
    image = models.ImageField(upload_to='food_images/', blank=True, null=True)
    ingredients = models.ManyToManyField(
        Ingredient, related_name="foods")  # Many-to-Many Relationship
    hazard_level = models.FloatField(default=0)

    approved_supervisors = models.ManyToManyField(
        User, related_name="approved_foods", blank=True)
    is_approved = models.BooleanField(default=True)

    # Add creation tracking
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        related_name="created_foods",
        null=True, blank=True
    )
    created_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.restaurant.name})"

    def calculate_hazard_level(self):
        """Calculate and set the hazard level based on the average of ingredients' hazard levels"""
        ingredients_list = self.ingredients.all()
        if ingredients_list.exists():
            avg_hazard = ingredients_list.aggregate(
                avg=Avg('hazard_level'))['avg'] or 0
            self.hazard_level = round(avg_hazard, 1)
            self.save(update_fields=['hazard_level'])
        else:
            self.hazard_level = 0
            self.save(update_fields=['hazard_level'])
        return self.hazard_level

    def save(self, *args, **kwargs):
        # Set created_date for new records only
        if not self.pk and not self.created_date:
            self.created_date = timezone.now()
        super().save(*args, **kwargs)

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

    # Add reason and date fields
    reason = models.TextField(blank=True, null=True)
    date = models.DateField(null=True, blank=True)

    # Add update tracking
    updated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        related_name="updated_foods",
        null=True, blank=True
    )
    updated_date = models.DateTimeField(null=True, blank=True)

    # Calculate hazard level
    new_hazard_level = models.FloatField(default=0)

    def __str__(self):
        return f"{self.new_name} ({self.new_restaurant.name})"

    def calculate_new_hazard_level(self):
        """Calculate the new hazard level based on the new ingredients"""
        ingredients = self.new_ingredients.all()
        if ingredients.exists():
            avg_hazard = ingredients.aggregate(
                avg=Avg('hazard_level'))['avg'] or 0
            self.new_hazard_level = round(avg_hazard, 1)
            self.save(update_fields=['new_hazard_level'])
        else:
            self.new_hazard_level = 0
            self.save(update_fields=['new_hazard_level'])
        return self.new_hazard_level

    def save(self, *args, **kwargs):
        # Set updated_date for new records only
        if not self.pk and not self.updated_date:
            self.updated_date = timezone.now()
        # Set date if not provided
        if not self.date:
            self.date = timezone.now().date()
        super().save(*args, **kwargs)

    class Meta:
        db_table = "FoodChanges"


class ConfirmationToken(models.Model):
    code = models.CharField(max_length=32)
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="confirmation_codes")

    class Meta:
        db_table = "ConfirmationTokens"
