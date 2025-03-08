import logging
from django.core.management.base import BaseCommand
from core.models import Ingredient
from django.db import transaction

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Add a comprehensive list of real ingredients with hazard levels to the database'

    def handle(self, *args, **options):
        """
        Hazard Level Guide:
        0: Safe for most people - natural, whole ingredients with minimal risk
        1: Minimal risk - generally recognized as safe, but may cause issues for some
        2: Mild risk - may cause reactions in sensitive people or moderate consumption concerns
        3: Moderate risk - known to cause reactions in many people or consumption should be limited
        4: High risk - major allergens or ingredients with serious health concerns
        """
        # Define the ingredients list with name, description, and hazard_level
        ingredients_data = [
            # Common Allergens - High Risk (Level 4)
            {
                'name': 'Peanuts',
                'description': 'Common legume allergen that can cause severe, potentially fatal, allergic reactions in sensitive individuals.',
                'hazard_level': 4
            },
            {
                'name': 'Tree Nuts',
                'description': 'Includes almonds, walnuts, cashews, etc. Major allergen that can cause severe reactions.',
                'hazard_level': 4
            },
            {
                'name': 'Milk',
                'description': 'Dairy product and common allergen. Contains lactose which many cannot digest.',
                'hazard_level': 3
            },
            {
                'name': 'Eggs',
                'description': 'Common allergen, particularly the proteins in egg whites.',
                'hazard_level': 4
            },
            {
                'name': 'Fish',
                'description': 'Major allergen that can cause severe allergic reactions in sensitive individuals.',
                'hazard_level': 4
            },
            {
                'name': 'Shellfish',
                'description': 'Includes shrimp, crab, lobster, etc. One of the most common food allergens.',
                'hazard_level': 4
            },
            {
                'name': 'Soy',
                'description': 'Common allergen found in many processed foods. Some individuals may be allergic or sensitive.',
                'hazard_level': 3
            },
            {
                'name': 'Wheat',
                'description': 'Contains gluten which causes issues for those with celiac disease or gluten sensitivity.',
                'hazard_level': 3
            },
            {
                'name': 'Sesame',
                'description': 'Increasingly recognized as a significant allergen that can cause severe reactions.',
                'hazard_level': 4
            },
            {
                'name': 'Sulfites',
                'description': 'Food preservatives that can trigger asthma attacks and other reactions in sensitive people.',
                'hazard_level': 3
            },

            # Food Additives - Various Risk Levels
            {
                'name': 'MSG (Monosodium Glutamate)',
                'description': 'Flavor enhancer that may cause headaches, flushing, and other symptoms in some individuals.',
                'hazard_level': 2
            },
            {
                'name': 'Artificial Food Coloring',
                'description': 'Synthetic dyes that may cause hyperactivity in children and allergic reactions in some people.',
                'hazard_level': 2
            },
            {
                'name': 'Sodium Nitrite/Nitrate',
                'description': 'Preservatives used in processed meats linked to increased cancer risk with high consumption.',
                'hazard_level': 3
            },
            {
                'name': 'BHA/BHT',
                'description': 'Preservatives with potential endocrine-disrupting effects and possible carcinogenic properties.',
                'hazard_level': 3
            },
            {
                'name': 'Aspartame',
                'description': 'Artificial sweetener that may cause headaches in some individuals.',
                'hazard_level': 2
            },
            {
                'name': 'High Fructose Corn Syrup',
                'description': 'Sweetener linked to obesity, diabetes, and other health issues when consumed in excess.',
                'hazard_level': 2
            },
            {
                'name': 'Trans Fats',
                'description': 'Partially hydrogenated oils linked to heart disease and inflammation.',
                'hazard_level': 4
            },

            # Fruits & Vegetables - Generally Safe (Level 0-1)
            {
                'name': 'Apples',
                'description': 'Common fruit rich in fiber and antioxidants.',
                'hazard_level': 0
            },
            {
                'name': 'Bananas',
                'description': 'Fruit rich in potassium and other nutrients.',
                'hazard_level': 0
            },
            {
                'name': 'Oranges',
                'description': 'Citrus fruit high in vitamin C and fiber.',
                'hazard_level': 0
            },
            {
                'name': 'Strawberries',
                'description': 'Berries rich in antioxidants but may cause allergic reactions in some.',
                'hazard_level': 1
            },
            {
                'name': 'Blueberries',
                'description': 'Small berries packed with antioxidants and nutrients.',
                'hazard_level': 0
            },
            {
                'name': 'Spinach',
                'description': 'Leafy green vegetable rich in iron and other nutrients.',
                'hazard_level': 0
            },
            {
                'name': 'Kale',
                'description': 'Nutrient-dense leafy green vegetable.',
                'hazard_level': 0
            },
            {
                'name': 'Broccoli',
                'description': 'Cruciferous vegetable with anti-inflammatory properties.',
                'hazard_level': 0
            },
            {
                'name': 'Carrots',
                'description': 'Root vegetable rich in beta-carotene and fiber.',
                'hazard_level': 0
            },
            {
                'name': 'Tomatoes',
                'description': 'Fruit/vegetable containing lycopene; may cause issues for those with nightshade sensitivities.',
                'hazard_level': 1
            },

            # Grains - Various Risk Levels
            {
                'name': 'White Rice',
                'description': 'Refined grain with minimal nutrients.',
                'hazard_level': 1
            },
            {
                'name': 'Brown Rice',
                'description': 'Whole grain with fiber and nutrients.',
                'hazard_level': 0
            },
            {
                'name': 'Barley',
                'description': 'Whole grain containing gluten, which affects those with celiac disease.',
                'hazard_level': 2
            },
            {
                'name': 'Oats',
                'description': 'Whole grain often processed in facilities with wheat; may contain trace gluten.',
                'hazard_level': 1
            },
            {
                'name': 'Quinoa',
                'description': 'Gluten-free pseudo-grain with complete protein profile.',
                'hazard_level': 0
            },

            # Meats & Proteins - Various Risk Levels
            {
                'name': 'Chicken',
                'description': 'Lean protein source that may cause allergic reactions in some individuals.',
                'hazard_level': 1
            },
            {
                'name': 'Beef',
                'description': 'Red meat protein source; high consumption linked to health issues.',
                'hazard_level': 2
            },
            {
                'name': 'Pork',
                'description': 'Meat that may carry food-borne illness if undercooked.',
                'hazard_level': 2
            },
            {
                'name': 'Lamb',
                'description': 'Red meat that may trigger allergic reactions in some individuals.',
                'hazard_level': 1
            },
            {
                'name': 'Tofu',
                'description': 'Soy-based protein source; allergen for those with soy allergies.',
                'hazard_level': 2
            },
            {
                'name': 'Tempeh',
                'description': 'Fermented soy product; allergen for those with soy allergies.',
                'hazard_level': 2
            },
            {
                'name': 'Lentils',
                'description': 'Legumes rich in protein and fiber.',
                'hazard_level': 0
            },

            # Dairy Products - Various Risk Levels
            {
                'name': 'Cheese',
                'description': 'Dairy product, contains lactose and milk proteins that cause allergies or intolerance in some.',
                'hazard_level': 2
            },
            {
                'name': 'Yogurt',
                'description': 'Fermented dairy product with less lactose than milk but still problematic for some.',
                'hazard_level': 2
            },
            {
                'name': 'Butter',
                'description': 'High-fat dairy product that may cause issues for those with dairy allergies/intolerances.',
                'hazard_level': 2
            },
            {
                'name': 'Cream',
                'description': 'High-fat dairy product that contains lactose and milk proteins.',
                'hazard_level': 2
            },

            # Sweeteners - Various Risk Levels
            {
                'name': 'Sugar',
                'description': 'Refined sweetener linked to obesity, diabetes when consumed in excess.',
                'hazard_level': 2
            },
            {
                'name': 'Honey',
                'description': 'Natural sweetener; unsafe for infants under 12 months due to botulism risk.',
                'hazard_level': 1
            },
            {
                'name': 'Maple Syrup',
                'description': 'Natural sweetener derived from maple tree sap.',
                'hazard_level': 1
            },
            {
                'name': 'Stevia',
                'description': 'Natural low-calorie sweetener derived from the stevia plant.',
                'hazard_level': 0
            },
            {
                'name': 'Saccharin',
                'description': 'Artificial sweetener with controversial safety profile.',
                'hazard_level': 2
            },

            # Oils - Various Risk Levels
            {
                'name': 'Olive Oil',
                'description': 'Healthy monounsaturated fat source.',
                'hazard_level': 0
            },
            {
                'name': 'Coconut Oil',
                'description': 'High in saturated fats; controversial health effects.',
                'hazard_level': 1
            },
            {
                'name': 'Canola Oil',
                'description': 'Refined oil with moderate amounts of omega-3 fatty acids.',
                'hazard_level': 1
            },
            {
                'name': 'Palm Oil',
                'description': 'High in saturated fats; environmental concerns with production.',
                'hazard_level': 2
            },

            # Spices & Herbs - Generally Safe (Level 0-1)
            {
                'name': 'Cinnamon',
                'description': 'Aromatic spice with anti-inflammatory properties.',
                'hazard_level': 0
            },
            {
                'name': 'Turmeric',
                'description': 'Anti-inflammatory spice containing curcumin.',
                'hazard_level': 0
            },
            {
                'name': 'Black Pepper',
                'description': 'Common spice that enhances bioavailability of other nutrients.',
                'hazard_level': 0
            },
            {
                'name': 'Garlic',
                'description': 'Aromatic with antioxidant and antimicrobial properties.',
                'hazard_level': 0
            },
            {
                'name': 'Basil',
                'description': 'Aromatic herb used in many cuisines.',
                'hazard_level': 0
            },
            {
                'name': 'Oregano',
                'description': 'Mediterranean herb with antimicrobial properties.',
                'hazard_level': 0
            },

            # Alcohols - Various Risk Levels
            {
                'name': 'Wine',
                'description': 'Fermented grape beverage with alcohol content.',
                'hazard_level': 3
            },
            {
                'name': 'Beer',
                'description': 'Alcoholic beverage containing gluten from barley or wheat.',
                'hazard_level': 3
            },
            {
                'name': 'Vodka',
                'description': 'Distilled alcoholic beverage typically made from grains or potatoes.',
                'hazard_level': 3
            },
            {
                'name': 'Rum',
                'description': 'Distilled alcoholic beverage made from sugarcane byproducts.',
                'hazard_level': 3
            },

            # Caffeine Sources - Various Risk Levels
            {
                'name': 'Coffee',
                'description': 'Caffeinated beverage that may cause jitters, sleep disturbances, and acid reflux in some.',
                'hazard_level': 2
            },
            {
                'name': 'Black Tea',
                'description': 'Caffeinated beverage with less caffeine than coffee.',
                'hazard_level': 1
            },
            {
                'name': 'Green Tea',
                'description': 'Caffeinated beverage rich in antioxidants.',
                'hazard_level': 1
            },
            {
                'name': 'Chocolate',
                'description': 'Contains caffeine and theobromine; may trigger migraines in some individuals.',
                'hazard_level': 2
            },

            # Additional Common Ingredients
            {
                'name': 'Salt',
                'description': 'Essential mineral; excessive consumption linked to high blood pressure.',
                'hazard_level': 1
            },
            {
                'name': 'Vinegar',
                'description': 'Fermented liquid used as a preservative and flavor enhancer.',
                'hazard_level': 0
            },
            {
                'name': 'Yeast',
                'description': 'Fungus used in baking and brewing; may cause reactions in those with yeast sensitivities.',
                'hazard_level': 1
            },
            {
                'name': 'Mushrooms',
                'description': 'Fungi that may cause allergic reactions in some individuals.',
                'hazard_level': 1
            },
            {
                'name': 'Seaweed',
                'description': 'Marine algae rich in iodine and other minerals.',
                'hazard_level': 1
            },
            {
                'name': 'Gelatin',
                'description': 'Animal-derived protein used as a thickener; problematic for vegetarians/vegans.',
                'hazard_level': 1
            },
        ]

        # Add batches of ingredients to the database within a transaction
        total_count = len(ingredients_data)
        created_count = 0
        updated_count = 0

        try:
            with transaction.atomic():
                for ingredient_data in ingredients_data:
                    # Check if ingredient already exists by name
                    ingredient, created = Ingredient.objects.update_or_create(
                        name=ingredient_data['name'],
                        defaults={
                            'description': ingredient_data['description'],
                            'hazard_level': ingredient_data['hazard_level']
                        }
                    )

                    if created:
                        created_count += 1
                        msg = f"Created ingredient: {ingredient.name} (Hazard Level: {ingredient.hazard_level})"
                    else:
                        updated_count += 1
                        msg = f"Updated ingredient: {ingredient.name} (Hazard Level: {ingredient.hazard_level})"

                    self.stdout.write(msg)

            self.stdout.write(self.style.SUCCESS(
                f"Successfully processed {total_count} ingredients: {created_count} created, {updated_count} updated."
            ))

        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f"Error adding ingredients: {str(e)}"))
            logger.error(f"Error adding ingredients: {str(e)}")
