from rest_framework import serializers
from .models import Product, Ingredient


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['id', 'Short_name', 'Description', 'Safety_level']


class ProductSerializer(serializers.ModelSerializer):
    # Nested serializer to show detailed information about ingredients
    ingredients_detail = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'Name', 'General_description', 'Ingredient_list', 'Macro_table']

    def get_ingredients_detail(self, obj):
        """
        Custom field to return details of the ingredients in the Ingredient_list.
        """
        ingredient_list = obj.Ingredient_list  # This is a dict with ingredient short names as keys
        ingredients = Ingredient.objects.filter(Short_name__in=ingredient_list.keys())
        return IngredientSerializer(ingredients, many=True).data
