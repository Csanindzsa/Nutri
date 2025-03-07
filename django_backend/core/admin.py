from django.contrib import admin
from .models import Restaurant, Food, FoodChange, Location, Ingredient, User
import logging

logger = logging.getLogger(__name__)

# Register your models here.
admin.site.register(Restaurant)
admin.site.register(Location)
admin.site.register(Ingredient)
admin.site.register(User)


@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    list_display = ('name', 'restaurant', 'is_approved', 'hazard_level')
    list_filter = ('is_approved', 'is_organic', 'is_gluten_free')
    search_fields = ('name', 'restaurant__name')
    filter_horizontal = ('ingredients', 'approved_supervisors')


@admin.register(FoodChange)
class FoodChangeAdmin(admin.ModelAdmin):
    list_display = ('new_name', 'new_restaurant', 'is_deletion',
                    'new_is_approved', 'approval_count')
    list_filter = ('new_is_approved', 'is_deletion', 'new_is_organic')
    search_fields = ('new_name', 'new_restaurant__name')
    filter_horizontal = ('new_ingredients', 'new_approved_supervisors')
    actions = ['approve_selected_changes']

    def approval_count(self, obj):
        return obj.new_approved_supervisors.count()
    approval_count.short_description = 'Approvals'

    def approve_selected_changes(self, request, queryset):
        """Custom admin action to approve selected food changes"""
        try:
            count = 0
            for change in queryset:
                if not change.new_is_approved:
                    change.new_is_approved = True
                    change.save()
                    count += 1

            self.message_user(
                request, f"{count} food changes were successfully approved.")
        except Exception as e:
            logger.error(f"Error approving food changes: {e}")
            self.message_user(
                request, f"Error approving changes: {str(e)}", level='error')
    approve_selected_changes.short_description = "Approve selected food changes"
