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
    image?: string;
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
}

// Add the FoodChange interface to better support the food change approval process
export interface FoodChange {
  id: number;
  food?: Food;
  original_food?: Food;
  updated_food?: Food;
  is_deletion: boolean;
  is_update?: boolean;
  change_type?: string;
  reason?: string;
  created_at: string;
  user_name?: string;
  approved_supervisors?: number[];
  rejected_supervisors?: number[];
  is_approved?: boolean;
  is_rejected?: boolean;
}