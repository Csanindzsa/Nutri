import logging
import random
from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import Restaurant, Food, Ingredient
from decimal import Decimal

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Create realistic sample foods for each restaurant in the database with varying hazard levels'

    def add_arguments(self, parser):
        parser.add_argument('--min', type=int, default=3,
                            help='Minimum number of foods per restaurant')
        parser.add_argument('--max', type=int, default=10,
                            help='Maximum number of foods per restaurant')
        parser.add_argument('--approved', action='store_true',
                            help='Mark foods as approved')

    def handle(self, *args, **options):
        min_foods = options['min']
        max_foods = options['max']
        is_approved = options['approved']

        # Get all restaurants and ingredients
        restaurants = Restaurant.objects.all()
        ingredients = list(Ingredient.objects.all())

        if not restaurants:
            self.stdout.write(self.style.ERROR(
                "No restaurants found in the database."))
            return

        if not ingredients:
            self.stdout.write(self.style.ERROR(
                "No ingredients found in the database."))
            return

        self.stdout.write(
            f"Creating sample foods for {restaurants.count()} restaurants...")

        # Group ingredients by hazard level for easier selection
        ingredients_by_hazard = {0: [], 1: [], 2: [], 3: [], 4: []}
        for ingredient in ingredients:
            ingredients_by_hazard[ingredient.hazard_level].append(ingredient)

        foods_created = 0

        # Food definitions by cuisine type
        cuisine_foods = self.get_cuisine_food_mapping()

        # Create foods for each restaurant
        for restaurant in restaurants:
            # Determine how many foods to create for this restaurant
            num_foods = random.randint(min_foods, max_foods)

            # Get cuisine type from restaurant, normalize it
            cuisine = restaurant.cuisine.lower().split(
                ';')[0] if restaurant.cuisine else "unknown"

            # Get appropriate food types for this cuisine
            food_types = cuisine_foods.get(cuisine, cuisine_foods["default"])

            # Create foods for this restaurant
            for _ in range(num_foods):
                try:
                    with transaction.atomic():
                        # Select a food type for this restaurant
                        food_type = random.choice(food_types)

                        # Create the food
                        food = self.create_food(
                            restaurant, food_type, ingredients_by_hazard, is_approved)

                        foods_created += 1
                        self.stdout.write(
                            f"Created {food.name} for {restaurant.name} (Hazard Level: {food.hazard_level})")
                except Exception as e:
                    self.stdout.write(self.style.ERROR(
                        f"Error creating food for {restaurant.name}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS(
            f"Successfully created {foods_created} foods for {restaurants.count()} restaurants"))

    def create_food(self, restaurant, food_type, ingredients_by_hazard, is_approved):
        """Create a single food item with ingredients"""
        food_info = self.get_food_details(food_type)

        # Create the base food object
        food = Food(
            name=food_info['name'],
            restaurant=restaurant,
            is_approved=is_approved,
            serving_size=food_info['serving_size'],
            is_organic=random.random() < food_info['organic_chance'],
            is_gluten_free=random.random() < food_info['gluten_free_chance'],
            is_alcohol_free=random.random() < food_info['alcohol_free_chance'],
            is_lactose_free=random.random() < food_info['lactose_free_chance'],
            macro_table={
                'energy_kcal': food_info['calories'],
                'fat': food_info['fat'],
                'saturated_fat': food_info['saturated_fat'],
                'carbohydrates': food_info['carbs'],
                'sugars': food_info['sugars'],
                'fiber': food_info['fiber'],
                'protein': food_info['protein'],
                'salt': food_info['salt'],
            }
        )

        # Save the food to generate an ID
        food.save()

        # Add ingredients - this is what will determine the hazard level
        self.add_ingredients_to_food(food, food_info, ingredients_by_hazard)

        # Calculate hazard level based on ingredients
        food.calculate_hazard_level()
        food.save()

        return food

    def add_ingredients_to_food(self, food, food_info, ingredients_by_hazard):
        """Add appropriate ingredients to the food"""
        # Determine target hazard level distribution for this food
        target_profile = random.choice([
            # Safe foods (mostly level 0-1 ingredients)
            [0.6, 0.3, 0.1, 0.0, 0.0],  # 90% safe ingredients
            # Moderate foods (mostly level 1-2 ingredients)
            [0.2, 0.5, 0.2, 0.1, 0.0],  # Mix of safe and moderate
            # Risky foods (includes level 3-4 ingredients)
            [0.1, 0.2, 0.3, 0.3, 0.1],  # More hazardous
            # Very risky foods (heavy on level 3-4)
            [0.0, 0.1, 0.2, 0.4, 0.3],  # Mainly hazardous
        ])

        # Select base ingredients for this food type
        num_ingredients = random.randint(
            food_info['min_ingredients'], food_info['max_ingredients'])
        selected_ingredients = []

        # Add ingredients according to target hazard profile
        for _ in range(num_ingredients):
            # Select hazard level based on distribution
            hazard_level = self.weighted_choice(range(5), target_profile)

            # If we have ingredients at this level
            if ingredients_by_hazard[hazard_level]:
                ingredient = random.choice(ingredients_by_hazard[hazard_level])
                if ingredient not in selected_ingredients:
                    selected_ingredients.append(ingredient)

        # Make sure we have at least some ingredients
        if not selected_ingredients:
            # Add some random ingredients if none were selected
            available_ingredients = [
                ing for level_ings in ingredients_by_hazard.values() for ing in level_ings]
            selected_ingredients = random.sample(
                available_ingredients, min(3, len(available_ingredients)))

        # Add the ingredients to the food
        food.ingredients.set(selected_ingredients)

    def weighted_choice(self, choices, weights):
        """Select an item from choices with probability weights"""
        total = sum(weights)
        r = random.uniform(0, total)
        upto = 0
        for i, w in enumerate(weights):
            upto += w
            if upto >= r:
                return choices[i]
        # Fallback
        return choices[0]

    def get_cuisine_food_mapping(self):
        """Define mappings between cuisines and appropriate foods"""
        return {
            "burger": ["hamburger", "cheeseburger", "bacon_burger", "veggie_burger", "chicken_burger",
                       "double_burger", "fish_burger", "bbq_burger"],

            "pizza": ["margherita_pizza", "pepperoni_pizza", "vegetarian_pizza", "hawaiian_pizza",
                      "four_cheese_pizza", "meat_lovers_pizza", "seafood_pizza", "bbq_chicken_pizza"],

            "chicken": ["fried_chicken", "grilled_chicken", "chicken_wings", "chicken_nuggets",
                        "chicken_sandwich", "chicken_salad", "chicken_wrap"],

            "kebab": ["doner_kebab", "shish_kebab", "adana_kebab", "chicken_kebab",
                      "mixed_kebab", "falafel_wrap", "gyros"],

            "chinese": ["kung_pao_chicken", "sweet_sour_chicken", "fried_rice", "chow_mein",
                        "spring_rolls", "wonton_soup", "beijing_duck", "mapo_tofu"],

            "italian": ["spaghetti_bolognese", "lasagna", "risotto", "carbonara",
                        "tiramisu", "ravioli", "gnocchi", "penne_arrabbiata"],

            "thai": ["pad_thai", "green_curry", "tom_yum_soup", "massaman_curry",
                     "thai_fried_rice", "satay", "spring_rolls"],

            "japanese": ["sushi_platter", "ramen", "tempura", "teriyaki_chicken",
                         "miso_soup", "gyoza", "katsu_curry"],

            "café": ["club_sandwich", "avocado_toast", "caesar_salad", "chicken_wrap",
                     "cappuccino", "croissant", "pancakes", "smoothie_bowl"],

            "cake": ["chocolate_cake", "cheesecake", "carrot_cake", "tiramisu",
                     "apple_pie", "ice_cream", "brownie", "cupcakes"],

            "friture": ["french_fries", "onion_rings", "fried_chicken", "calamari",
                        "corn_dogs", "mozzarella_sticks", "chicken_tenders"],

            "regional": ["stew", "goulash", "schnitzel", "roast_beef", "fish_and_chips",
                         "sausages", "stuffed_cabbage", "pancakes"],

            "sandwich": ["club_sandwich", "blt", "tuna_sandwich", "ham_cheese",
                         "grilled_cheese", "veggie_sandwich", "chicken_sandwich"],

            "default": ["house_special", "chef_salad", "daily_soup", "mixed_grill",
                        "vegetable_platter", "rice_bowl", "pasta_dish"]
        }

    def get_food_details(self, food_type):
        """Get details for a specific food type"""
        # Base template with default values
        template = {
            'name': "",
            'calories': 500,
            'fat': 20,
            'saturated_fat': 5,
            'carbs': 50,
            'sugars': 10,
            'fiber': 3,
            'protein': 15,
            'salt': 2,
            'serving_size': 300,
            'min_ingredients': 4,
            'max_ingredients': 10,
            'organic_chance': 0.1,
            'gluten_free_chance': 0.1,
            'alcohol_free_chance': 0.9,
            'lactose_free_chance': 0.3,
        }

        # Food-specific details
        foods = {
            # Burgers
            "hamburger": {
                'name': "Classic Hamburger",
                'calories': 550,
                'fat': 30,
                'saturated_fat': 12,
                'carbs': 40,
                'sugars': 8,
                'protein': 25,
                'serving_size': 220,
                'gluten_free_chance': 0.05,
            },

            "cheeseburger": {
                'name': "Cheeseburger",
                'calories': 650,
                'fat': 35,
                'saturated_fat': 15,
                'carbs': 40,
                'sugars': 8,
                'protein': 30,
                'serving_size': 250,
                'lactose_free_chance': 0.0,
            },

            "bacon_burger": {
                'name': "Bacon Burger",
                'calories': 750,
                'fat': 45,
                'saturated_fat': 18,
                'protein': 35,
                'salt': 3.5,
                'serving_size': 280,
            },

            "veggie_burger": {
                'name': "Veggie Burger",
                'calories': 450,
                'fat': 20,
                'saturated_fat': 3,
                'carbs': 55,
                'fiber': 8,
                'protein': 15,
                'serving_size': 220,
                'organic_chance': 0.7,
            },

            "chicken_burger": {
                'name': "Grilled Chicken Burger",
                'calories': 500,
                'fat': 25,
                'saturated_fat': 5,
                'protein': 35,
                'serving_size': 240,
            },

            "double_burger": {
                'name': "Double Beef Burger",
                'calories': 900,
                'fat': 60,
                'saturated_fat': 25,
                'carbs': 45,
                'protein': 50,
                'salt': 4,
                'serving_size': 350,
            },

            "fish_burger": {
                'name': "Fish Fillet Burger",
                'calories': 450,
                'fat': 22,
                'saturated_fat': 4,
                'protein': 20,
                'serving_size': 200,
            },

            # Pizzas
            "margherita_pizza": {
                'name': "Margherita Pizza",
                'calories': 850,
                'fat': 20,
                'saturated_fat': 8,
                'carbs': 120,
                'protein': 30,
                'serving_size': 350,
                'lactose_free_chance': 0.0,
            },

            "pepperoni_pizza": {
                'name': "Pepperoni Pizza",
                'calories': 950,
                'fat': 30,
                'saturated_fat': 12,
                'carbs': 120,
                'protein': 35,
                'salt': 4.5,
                'serving_size': 380,
                'lactose_free_chance': 0.0,
            },

            "vegetarian_pizza": {
                'name': "Vegetarian Pizza",
                'calories': 800,
                'fat': 18,
                'saturated_fat': 7,
                'carbs': 120,
                'fiber': 6,
                'protein': 25,
                'serving_size': 360,
                'organic_chance': 0.4,
            },

            "hawaiian_pizza": {
                'name': "Hawaiian Pizza",
                'calories': 900,
                'fat': 22,
                'saturated_fat': 10,
                'carbs': 125,
                'sugars': 15,
                'protein': 32,
                'serving_size': 370,
            },

            "four_cheese_pizza": {
                'name': "Four Cheese Pizza",
                'calories': 950,
                'fat': 35,
                'saturated_fat': 18,
                'carbs': 115,
                'protein': 40,
                'serving_size': 360,
                'lactose_free_chance': 0.0,
            },

            "meat_lovers_pizza": {
                'name': "Meat Lovers Pizza",
                'calories': 1100,
                'fat': 45,
                'saturated_fat': 20,
                'carbs': 120,
                'protein': 50,
                'salt': 5,
                'serving_size': 400,
            },

            "seafood_pizza": {
                'name': "Seafood Pizza",
                'calories': 900,
                'fat': 25,
                'saturated_fat': 8,
                'carbs': 120,
                'protein': 35,
                'serving_size': 380,
            },

            # Chicken dishes
            "fried_chicken": {
                'name': "Fried Chicken",
                'calories': 800,
                'fat': 50,
                'saturated_fat': 12,
                'carbs': 40,
                'protein': 60,
                'serving_size': 280,
                'gluten_free_chance': 0.0,
            },

            "grilled_chicken": {
                'name': "Grilled Chicken",
                'calories': 400,
                'fat': 15,
                'saturated_fat': 3,
                'carbs': 2,
                'protein': 70,
                'serving_size': 220,
                'gluten_free_chance': 0.9,
                'lactose_free_chance': 0.9,
            },

            "chicken_wings": {
                'name': "Chicken Wings",
                'calories': 700,
                'fat': 45,
                'saturated_fat': 10,
                'carbs': 20,
                'protein': 50,
                'serving_size': 250,
                'gluten_free_chance': 0.5,
            },

            "chicken_nuggets": {
                'name': "Chicken Nuggets",
                'calories': 450,
                'fat': 28,
                'saturated_fat': 5,
                'carbs': 30,
                'protein': 22,
                'serving_size': 180,
                'gluten_free_chance': 0.0,
            },

            "chicken_sandwich": {
                'name': "Chicken Sandwich",
                'calories': 550,
                'fat': 25,
                'saturated_fat': 5,
                'carbs': 50,
                'protein': 30,
                'serving_size': 250,
            },

            # Kebab and wraps
            "doner_kebab": {
                'name': "Döner Kebab",
                'calories': 650,
                'fat': 35,
                'saturated_fat': 10,
                'carbs': 60,
                'protein': 35,
                'salt': 3,
                'serving_size': 340,
            },

            "shish_kebab": {
                'name': "Shish Kebab",
                'calories': 450,
                'fat': 20,
                'saturated_fat': 6,
                'carbs': 10,
                'protein': 60,
                'serving_size': 280,
                'gluten_free_chance': 0.8,
            },

            "chicken_kebab": {
                'name': "Chicken Kebab",
                'calories': 500,
                'fat': 22,
                'saturated_fat': 5,
                'carbs': 40,
                'protein': 45,
                'serving_size': 300,
            },

            "gyros": {
                'name': "Gyros Pita",
                'calories': 700,
                'fat': 38,
                'saturated_fat': 12,
                'carbs': 60,
                'protein': 30,
                'salt': 3.2,
                'serving_size': 330,
            },

            # Chinese dishes
            "kung_pao_chicken": {
                'name': "Kung Pao Chicken",
                'calories': 650,
                'fat': 35,
                'saturated_fat': 6,
                'carbs': 40,
                'protein': 40,
                'salt': 3.5,
                'serving_size': 320,
            },

            "sweet_sour_chicken": {
                'name': "Sweet & Sour Chicken",
                'calories': 700,
                'fat': 25,
                'saturated_fat': 5,
                'carbs': 90,
                'sugars': 30,
                'protein': 30,
                'serving_size': 350,
            },

            "fried_rice": {
                'name': "Fried Rice",
                'calories': 600,
                'fat': 18,
                'saturated_fat': 3,
                'carbs': 90,
                'protein': 15,
                'salt': 2.8,
                'serving_size': 300,
            },

            # Italian dishes
            "spaghetti_bolognese": {
                'name': "Spaghetti Bolognese",
                'calories': 700,
                'fat': 25,
                'saturated_fat': 8,
                'carbs': 80,
                'protein': 35,
                'serving_size': 350,
            },

            "lasagna": {
                'name': "Lasagna",
                'calories': 650,
                'fat': 30,
                'saturated_fat': 15,
                'carbs': 60,
                'protein': 35,
                'serving_size': 300,
                'lactose_free_chance': 0.0,
            },

            "carbonara": {
                'name': "Pasta Carbonara",
                'calories': 600,
                'fat': 30,
                'saturated_fat': 12,
                'carbs': 70,
                'protein': 20,
                'serving_size': 280,
                'lactose_free_chance': 0.0,
            },

            # Thai dishes
            "pad_thai": {
                'name': "Pad Thai",
                'calories': 580,
                'fat': 20,
                'saturated_fat': 4,
                'carbs': 80,
                'protein': 20,
                'serving_size': 340,
            },

            "green_curry": {
                'name': "Green Curry",
                'calories': 550,
                'fat': 35,
                'saturated_fat': 20,
                'carbs': 30,
                'protein': 35,
                'serving_size': 320,
            },

            # Japanese dishes
            "sushi_platter": {
                'name': "Sushi Platter",
                'calories': 500,
                'fat': 10,
                'saturated_fat': 1,
                'carbs': 80,
                'protein': 30,
                'salt': 3,
                'serving_size': 350,
                'lactose_free_chance': 0.9,
            },

            "ramen": {
                'name': "Ramen",
                'calories': 550,
                'fat': 18,
                'saturated_fat': 5,
                'carbs': 70,
                'protein': 25,
                'salt': 5,
                'serving_size': 400,
            },

            # Cafe items
            "club_sandwich": {
                'name': "Club Sandwich",
                'calories': 550,
                'fat': 30,
                'saturated_fat': 6,
                'carbs': 40,
                'protein': 30,
                'serving_size': 280,
            },

            "caesar_salad": {
                'name': "Caesar Salad",
                'calories': 400,
                'fat': 30,
                'saturated_fat': 6,
                'carbs': 10,
                'protein': 25,
                'serving_size': 250,
                'gluten_free_chance': 0.5,
            },

            # Desserts
            "chocolate_cake": {
                'name': "Chocolate Cake",
                'calories': 450,
                'fat': 22,
                'saturated_fat': 10,
                'carbs': 65,
                'sugars': 45,
                'protein': 6,
                'serving_size': 120,
                'lactose_free_chance': 0.1,
            },

            "cheesecake": {
                'name': "Cheesecake",
                'calories': 400,
                'fat': 25,
                'saturated_fat': 14,
                'carbs': 35,
                'sugars': 30,
                'protein': 7,
                'serving_size': 110,
                'lactose_free_chance': 0.0,
                'gluten_free_chance': 0.3,
            },

            # French fries and sides
            "french_fries": {
                'name': "French Fries",
                'calories': 350,
                'fat': 18,
                'saturated_fat': 3,
                'carbs': 45,
                'protein': 4,
                'salt': 1,
                'serving_size': 150,
                'gluten_free_chance': 0.8,
                'lactose_free_chance': 0.9,
            },

            "onion_rings": {
                'name': "Onion Rings",
                'calories': 400,
                'fat': 22,
                'saturated_fat': 4,
                'carbs': 40,
                'protein': 5,
                'serving_size': 140,
                'gluten_free_chance': 0.0,
            },

            # Regional/traditional dishes
            "goulash": {
                'name': "Goulash",
                'calories': 550,
                'fat': 25,
                'saturated_fat': 10,
                'carbs': 30,
                'protein': 40,
                'serving_size': 350,
                'gluten_free_chance': 0.8,
            },

            "schnitzel": {
                'name': "Wiener Schnitzel",
                'calories': 650,
                'fat': 35,
                'saturated_fat': 8,
                'carbs': 40,
                'protein': 45,
                'serving_size': 280,
                'gluten_free_chance': 0.0,
            },

            # Add more foods as needed...

            # Fallback for any food type not explicitly defined
            "house_special": {
                'name': "House Special",
                'calories': random.randint(400, 900),
                'fat': random.randint(15, 50),
                'saturated_fat': random.randint(3, 20),
                'carbs': random.randint(30, 120),
                'sugars': random.randint(5, 30),
                'protein': random.randint(15, 50),
                'serving_size': random.randint(200, 400),
            }
        }

        # Make a copy of the template
        food_details = template.copy()

        # If we have specific details for this food type, update the template
        if food_type in foods:
            food_details.update(foods[food_type])
        else:
            # For unknown food types, use the house special with a custom name
            food_details.update(foods["house_special"])
            food_details['name'] = ' '.join(
                [word.capitalize() for word in food_type.split('_')])

        # Add some randomness to the values
        for key in ['calories', 'fat', 'saturated_fat', 'carbs', 'sugars', 'fiber', 'protein', 'salt', 'serving_size']:
            # Add ±10% randomness
            variation = 0.1
            food_details[key] *= random.uniform(1 - variation, 1 + variation)

        # Round the values appropriately
        food_details['calories'] = round(food_details['calories'])
        food_details['fat'] = round(food_details['fat'], 1)
        food_details['saturated_fat'] = round(food_details['saturated_fat'], 1)
        food_details['carbs'] = round(food_details['carbs'], 1)
        food_details['sugars'] = round(food_details['sugars'], 1)
        food_details['fiber'] = round(food_details['fiber'], 1)
        food_details['protein'] = round(food_details['protein'], 1)
        food_details['salt'] = round(food_details['salt'], 1)
        food_details['serving_size'] = round(food_details['serving_size'])

        return food_details
