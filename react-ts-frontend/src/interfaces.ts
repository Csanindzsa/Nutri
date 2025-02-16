export interface Restaurant {
    id: number;
    name: string;
    foods_on_menu: number;
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

export interface Food {
    id: number;
    restaurant: number;
    restaurant_name: string;  // Add this field
    name: string;
    macro_table: Record<string, any>;
    is_organic: boolean;
    is_gluten_free: boolean;
    is_alcohol_free: boolean;
    is_lactose_free: boolean;
    ingredients: number[];
    image?: string;
    approved_supervisors_count?: number;
}