from django.core.management.base import BaseCommand
from core.models import Food, Ingredient, Restaurant
from faker import Faker
from faker_food import FoodProvider
fake = Faker()
fake.add_provider(FoodProvider)

fake = Faker()

class Command(BaseCommand):
    help = 'Seed database with fake data'

    def create_ingredients(self, *args, **kwargs):
        Ingredient.objects.create(
            
        )


    def handle(self, *args, **kwargs):
        for _ in range(10):
            Food.objects.create(
                name=fake.name(),
                email=fake.email()
            )
        self.stdout.write(self.style.SUCCESS('Successfully added 10 fake entries'))