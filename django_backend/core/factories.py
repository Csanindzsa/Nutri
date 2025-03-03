# factories.py
import factory
from factory import Faker, SubFactory, LazyAttribute
from django.db.models import Avg
from .models import *

# Factory for User model


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = Faker('email')
    username = Faker('user_name')
    is_active = Faker('boolean')
    is_staff = Faker('boolean')
    is_supervisor = Faker('boolean')
    date_joined = Faker('date_this_decade')

# Factory for Restaurant model


class RestaurantFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Restaurant

    name = Faker('company')
    foods_on_menu = Faker('random_int', min=0, max=100)
    image = Faker('image_url')  # Generate a random image URL
    cuisine = Faker('word')
    description = Faker('paragraph')

# Factory for Ingredient model


class IngredientFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Ingredient

    name = Faker('word')
    description = Faker('paragraph')
    hazard_level = Faker('random_int', min=0, max=3)

# Factory for Location model (Many-to-Many with Restaurant)


class LocationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Location

    city_name = Faker('city')
    postal_code = Faker('postcode')

    # This creates a random set of related restaurants
    restaurants = factory.RelatedFactoryList(
        # creates 2 related restaurants by default
        RestaurantFactory, 'locations', size=2
    )

# # Factory for ExactLocation model (ForeignKey to Restaurant)


# class ExactLocationFactory(factory.django.DjangoModelFactory):
#     class Meta:
#         model = ExactLocation

#     city_name = Faker('city')
#     postal_code = Faker('postcode')
#     street_name = Faker('street_name')
#     street_type = Faker('street_suffix')
#     house_number = Faker('building_number')
#     restaurant = SubFactory(RestaurantFactory)

# Factory for Food model


class FoodFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Food

    restaurant = SubFactory(RestaurantFactory)
    name = Faker('food')
    # You can adjust macros as needed
    macro_table = LazyAttribute(
        lambda _: {'carbs': 30, 'protein': 20, 'fat': 10})
    calories = Faker('random_int', min=1, max=2000)
    is_organic = Faker('boolean')
    is_gluten_free = Faker('boolean')
    is_alcohol_free = Faker('boolean')
    is_lactose_free = Faker('boolean')
    # If you want to generate image files, you can use factory.Faker('image_url')
    image = None
    ingredients = factory.RelatedFactoryList(
        IngredientFactory, 'foods', size=3)  # Related ingredients, 3 by default
    approved_supervisors = factory.RelatedFactoryList(
        UserFactory, 'approved_foods', size=2)  # Related approved supervisors, 2 by default
    is_approved = Faker('boolean')

    @factory.post_generation
    def calculate_hazard_level(self, create, extracted, **kwargs):
        """Calculate the hazard_level as the average of ingredients' hazard levels."""
        if create:
            # Get all ingredients for this food
            ingredient_list = self.ingredients.all()
            if ingredient_list.exists():
                avg_hazard = ingredient_list.aggregate(
                    avg=Avg('hazard_level'))['avg'] or 0
                self.hazard_level = round(avg_hazard)
                self.save()
            else:
                self.hazard_level = 0
                self.save()


class FoodChangeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FoodChange

    # Generate fields
    old_version = factory.SubFactory(FoodFactory)
    new_restaurant = factory.SubFactory(RestaurantFactory)
    new_name = Faker('word')
    new_macro_table = factory.LazyFunction(
        lambda: {"protein": 10, "carbs": 20, "fat": 15})  # Example macros
    calories = Faker('random_int', min=1, max=2000)
    new_is_organic = Faker('boolean')
    new_is_gluten_free = Faker('boolean')
    new_is_alcohol_free = Faker('boolean')
    new_is_lactose_free = Faker('boolean')
    new_image = None
    # Assuming IngredientFactory is defined elsewhere
    new_ingredients = factory.SubFactory(IngredientFactory)
    new_approved_supervisors = factory.LazyFunction(lambda: [UserFactory(
        is_supervisor=True)])  # Assuming UserFactory is defined elsewhere
    new_is_approved = Faker('boolean')

    @factory.lazy_attribute
    def new_hazard_level(self):
        # For FoodChange, it seems new_ingredients is a single Ingredient, not a collection
        if hasattr(self, 'new_ingredients'):
            return self.new_ingredients.hazard_level
        return 0
