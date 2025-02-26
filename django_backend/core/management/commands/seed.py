from django.core.management.base import BaseCommand
from core.models import Food, Ingredient, Restaurant
from faker import Faker
from faker_food import FoodProvider
import random

fake = Faker()
fake.add_provider(FoodProvider)

class Command(BaseCommand):
    help = 'Seed database with fake data'

    def create_ingredients(self):
        """Creates 50 unique ingredients."""
        self.stdout.write("Creating Ingredients...")

        ingredient_names = set()
        while len(ingredient_names) < 50:
            ingredient_name = fake.ingredient()

            # Ensure ingredient is unique before adding
            if ingredient_name not in ingredient_names and not Ingredient.objects.filter(name=ingredient_name).exists():
                Ingredient.objects.get_or_create(
                    name=ingredient_name,
                    defaults={
                        "description": fake.sentence(),
                        "hazard_level": random.choice([0, 1, 2, 3])
                    }
                )
                ingredient_names.add(ingredient_name)

        self.stdout.write(self.style.SUCCESS(f"✅ {len(ingredient_names)} Unique Ingredients created!"))

    def create_restaurants(self):
        """Creates 15 restaurants."""
        self.stdout.write("Creating Restaurants...")

        restaurants = []
        for _ in range(15):
            restaurant = Restaurant.objects.create(
                name=fake.company(),
                foods_on_menu=random.randint(1, 10)
            )
            restaurants.append(restaurant)

        self.stdout.write(self.style.SUCCESS("✅ 15 Restaurants created!"))
        return restaurants

    def generate_macro_table(self):
        """Generates realistic macro values."""
        energy_kcal = random.randint(50, 900)
        fat = round(random.uniform(1, 50), 2)
        saturated_fat = round(random.uniform(0, fat * 0.6), 2)
        carbohydrates = round(random.uniform(1, 100), 2)
        sugars = round(random.uniform(0, carbohydrates * 0.8), 2)
        fiber = round(random.uniform(0, 15), 2)
        protein = round(random.uniform(1, 100), 2)
        salt = round(random.uniform(0, 5), 2)

        return {
            "energy_kcal": energy_kcal,
            "fat": fat,
            "saturated_fat": saturated_fat,
            "carbohydrates": carbohydrates,
            "sugars": sugars,
            "fiber": fiber,
            "protein": protein,
            "salt": salt
        }

    def create_foods(self, restaurants):
        """Creates 60 foods with random ingredients."""
        self.stdout.write("Creating Foods...")
        fake.unique.clear()

        ingredients = list(Ingredient.objects.all())  # Fetch ingredients from DB
        for _ in range(30):
            restaurant = random.choice(restaurants)
            food_ingredients = random.sample(ingredients, random.randint(2, 6))

            food = Food.objects.create(
                restaurant=restaurant,
                name=fake.unique.dish(),
                macro_table=self.generate_macro_table(),
                serving_size=random.choice([100, 200, 300]),
                is_organic=fake.boolean(),
                is_gluten_free=fake.boolean(),
                is_alcohol_free=fake.boolean(),
                is_lactose_free=fake.boolean()
            )
            food.ingredients.set(food_ingredients)

        self.stdout.write(self.style.SUCCESS("✅ 30 Foods created!"))

    def handle(self, *args, **kwargs):
        self.create_ingredients()
        restaurants = self.create_restaurants()
        self.create_foods(restaurants)

        self.stdout.write(self.style.SUCCESS("🎉 Database successfully seeded!"))
