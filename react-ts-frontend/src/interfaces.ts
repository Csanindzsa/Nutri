export interface User {
    id: number;
    email: string;
    username: string;
    is_supervisor: boolean;
}

export interface Restaurant {
    id: number;
    name: string;
    foods_on_menu: number;
    description?: string | null;
    image?: string;  // This will now be either a full URL or a local asset name
    imageIsLocal?: boolean;  // Flag to determine if image should load from assets
    location?: string;
    cuisine: string;
    average_rating?: number;
    latitude?: number;  // Add latitude for geolocation
    longitude?: number; // Add longitude for geolocation
    // ...other existing properties
}

export interface ExactLocation {
    city_name: string;
    postal_code: string;
    street_name: string;
    street_type: string;
    house_number: number;
    restaurant_id: number;  // Represents the foreign key as an ID
}  

export interface Ingredient {
    id: number;
    name: string;
    description?: string | null;
    hazard_level: 0 | 1 | 2 | 3; // Enum values
}

export interface Supervisor {
    id: number;
    username: string;
}

  
export interface MacroTable {
    energy_kcal: number;
    fat: number;
    saturated_fat: number;
    carbohydrates: number;
    sugars: number;
    fiber: number;
    protein: number;
    salt: number;
}

export interface Food {
    id: number;
    // calories: number;
    restaurant: number;
    restaurant_name: string;  // Add this field
    name: string;
    serving_size: number;
    macro_table: MacroTable;
    is_organic: boolean;
    is_gluten_free: boolean;
    is_alcohol_free: boolean;
    is_lactose_free: boolean;
    ingredients: number[];
    image?: string;
    approved_supervisors_count?: number;
    approved_supervisors?: Supervisor[];
    hazard_level?: number;  // Add this field
}

export interface FoodChange {
    id: number;
    is_deletion: boolean;
    old_version: number;
    new_restaurant: number;
    new_restaurant_name: string;  // Add this field
    new_name: string;
    new_serving_size: number;
    new_macro_table: MacroTable;
    new_is_organic: boolean;
    new_is_gluten_free: boolean;
    new_is_alcohol_free: boolean;
    new_is_lactose_free: boolean;
    new_ingredients: number[];
    new_image?: string;
    new_approved_supervisors_count?: number;
    new_approved_supervisors?: number[];
    // Add these fields to match the backend structure
    date?: string;
    reason?: string;
    updated_by?: string;
    updated_date?: string;
    new_hazard_level?: number;
}