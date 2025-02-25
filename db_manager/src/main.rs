use rusqlite::{params, Connection, Result};
use serde_json::json;
use std::fs::File;
use std::io::{self, BufRead};
use std::path::Path;
use rand::prelude::*;  // Import for random selection

fn main() -> Result<()> {
    let db_path = r"C:\Users\csabi\Desktop\Nutri\django_backend\db.sqlite3";
    
    // Open SQLite connection
    let conn = Connection::open(db_path)?;

    // Enable WAL mode to prevent locking issues
    let _: String = conn.query_row("PRAGMA journal_mode=WAL;", [], |row| row.get(0))?;

    // Read and insert restaurants
    let restaurant_file = "restaurants.txt";
    if let Ok(lines) = read_lines(restaurant_file) {
        for line in lines {
            if let Ok(name) = line {
                if !name.trim().is_empty() {
                    insert_restaurant(&conn, &name)?;
                }
            }
        }
    }

    // Read and insert ingredients from CSV
    let ingredients_file = "ingredients.csv"; // New CSV file for ingredients
    if let Ok(lines) = read_lines(ingredients_file) {
        for (index, line) in lines.enumerate() {
            if let Ok(data) = line {
                if index == 0 {
                    continue; // Skip header
                }
                let parts: Vec<&str> = data.split(';').collect();
                if parts.len() == 3 {
                    let name = parts[0].trim();
                    let description = parts[1].trim();
                    let hazard_level: i32 = parts[2].trim().parse().unwrap_or(0); // Default to 0 if invalid
                    insert_ingredient(&conn, name, description, hazard_level)?;  // Insert each ingredient
                } else {
                    eprintln!("Skipping invalid line in ingredients.csv: {}", data);
                }
            }
        }
    }

    // Fetch all restaurant IDs
    let mut stmt = conn.prepare("SELECT id FROM restaurants")?;
    let restaurant_ids: Vec<i32> = stmt.query_map([], |row| row.get(0))?
        .filter_map(Result::ok)
        .collect();

    if restaurant_ids.is_empty() {
        eprintln!("No restaurants found in the database!");
        return Ok(());
    }

    // Read and insert foods
    let foods_file = "foods.csv";
    if let Ok(lines) = read_lines(foods_file) {
        for (index, line) in lines.enumerate() {
            if let Ok(data) = line {
                if index == 0 {
                    continue; // Skip header
                }
                let parts: Vec<&str> = data.split(';').collect();
                if parts.len() == 20 {
                    let name = parts[0].trim();

                    let macro_table = json!( {
                        "energy_kcal": parts[1].trim().parse::<i32>().unwrap_or(0),
                        "fat": {
                            "per100g": parts[2].trim().parse::<f32>().unwrap_or(0.0),
                            "percentage": parts[3].trim().parse::<f32>().unwrap_or(0.0),
                        },
                        "saturated_fat": {
                            "per100g": parts[4].trim().parse::<f32>().unwrap_or(0.0),
                            "percentage": parts[5].trim().parse::<f32>().unwrap_or(0.0),
                        },
                        "carbohydrates": {
                            "per100g": parts[6].trim().parse::<f32>().unwrap_or(0.0),
                            "percentage": parts[7].trim().parse::<f32>().unwrap_or(0.0),
                        },
                        "sugars": {
                            "per100g": parts[8].trim().parse::<f32>().unwrap_or(0.0),
                            "percentage": parts[9].trim().parse::<f32>().unwrap_or(0.0),
                        },
                        "protein": {
                            "per100g": parts[10].trim().parse::<f32>().unwrap_or(0.0),
                            "percentage": parts[11].trim().parse::<f32>().unwrap_or(0.0),
                        },
                        "fiber": {
                            "per100g": parts[12].trim().parse::<f32>().unwrap_or(0.0),
                            "percentage": parts[13].trim().parse::<f32>().unwrap_or(0.0),
                        },
                        "salt": {
                            "per100g": parts[14].trim().parse::<f32>().unwrap_or(0.0),
                            "percentage": parts[15].trim().parse::<f32>().unwrap_or(0.0),
                        }
                    });

                    let is_organic = parts[16].trim().parse::<bool>().unwrap_or(false);
                    let is_gluten_free = parts[17].trim().parse::<bool>().unwrap_or(false);
                    let is_alcohol_free = parts[18].trim().parse::<bool>().unwrap_or(false);
                    let is_lactose_free = parts[19].trim().parse::<bool>().unwrap_or(false);

                    insert_food(&conn, name, &macro_table.to_string(), is_organic, is_gluten_free, is_alcohol_free, is_lactose_free)?; 
                } else {
                    eprintln!("Skipping invalid line in foods.csv: {}", data);
                }
            }
        }
    }

    // Generate random food-ingredient relationships
    create_random_food_ingredient_relations(&conn)?;

    println!("Data inserted successfully!");
    Ok(())
}

// Function to insert an ingredient
fn insert_ingredient(conn: &Connection, name: &str, description: &str, hazard_level: i32) -> Result<()> {
    conn.execute(
        "INSERT OR IGNORE INTO ingredients (name, description, hazard_level) VALUES (?1, ?2, ?3)",
        params![name, description, hazard_level],
    )?;
    println!("Inserted ingredient: {} (Hazard Level: {})", name, hazard_level);
    Ok(())
}

// Function to insert a restaurant
fn insert_restaurant(conn: &Connection, name: &str) -> Result<()> {
    conn.execute("INSERT OR IGNORE INTO restaurants (name, foods_on_menu) VALUES (?1, 0)", params![name])?;
    println!("Inserted restaurant: {}", name);
    Ok(())
}

// Function to insert food
fn insert_food(conn: &Connection, name: &str, macro_table: &str, is_organic: bool, is_gluten_free: bool, is_alcohol_free: bool, is_lactose_free: bool) -> Result<()> {
    // Retrieve all restaurant_ids from the restaurants table
    let mut stmt = conn.prepare("SELECT id FROM restaurants")?;
    let restaurant_ids: Vec<i32> = stmt.query_map([], |row| row.get(0))?
        .filter_map(Result::ok)
        .collect();

    // Check if we have any restaurant IDs
    if restaurant_ids.is_empty() {
        eprintln!("No restaurants found in the database!");
        return Ok(());
    }

    // Randomly choose a restaurant_id from the list of restaurant_ids
    let mut rng = rand::rng();
    let selected_restaurant_id = restaurant_ids.choose(&mut rng).unwrap();  // Safely unwrap as we know there's at least one restaurant

    // Insert the food into the randomly selected restaurant
    conn.execute(
        "INSERT OR IGNORE INTO foods (restaurant_id, name, macro_table, is_organic, is_gluten_free, is_alcohol_free, is_lactose_free) 
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![selected_restaurant_id, name, macro_table, is_organic, is_gluten_free, is_alcohol_free, is_lactose_free],
    )?;
    
    println!("Inserted food: {} (Restaurant ID: {})", name, selected_restaurant_id);
    Ok(())
}

// Function to create random food-ingredient relationships
fn create_random_food_ingredient_relations(conn: &Connection) -> Result<()> {
    // Get all food IDs
    let mut stmt = conn.prepare("SELECT id FROM foods")?;
    let food_ids: Vec<i32> = stmt.query_map([], |row| row.get(0))?.filter_map(Result::ok).collect();
    println!("Food IDs: {:?}", food_ids); // Debugging

    // Get all ingredient IDs
    let mut stmt = conn.prepare("SELECT id FROM ingredients")?;
    let ingredient_ids: Vec<i32> = stmt.query_map([], |row| row.get(0))?.filter_map(Result::ok).collect();
    println!("Ingredient IDs: {:?}", ingredient_ids); // Debugging

    if food_ids.is_empty() || ingredient_ids.is_empty() {
        eprintln!("No foods or ingredients found in the database!");
        return Ok(());
    }

    // Generate random relationships (linking each food to 1-3 random ingredients)
    let mut rng = rand::rng();
    for &food_id in food_ids.iter() {
        let num_ingredients = rng.random_range(1..=3); // Random number of ingredients (1 to 3)
        let random_ingredients = ingredient_ids.choose_multiple(&mut rng, num_ingredients);

        println!("Food ID: {} will be linked to ingredients: {:?}", food_id, random_ingredients); // Debugging

        for &ingredient_id in random_ingredients {
            insert_food_ingredient(&conn, food_id, ingredient_id)?;
        }
    }

    println!("Random food-ingredient relationships inserted.");
    Ok(())
}

fn insert_food_ingredient(conn: &Connection, food_id: i32, ingredient_id: i32) -> Result<()> {
    conn.execute(
        "INSERT OR IGNORE INTO foods_ingredients (food_id, ingredient_id) VALUES (?1, ?2)",
        params![food_id, ingredient_id],
    )?;
    println!("Linked Food ID {} with Ingredient ID {}", food_id, ingredient_id); // Debugging
    Ok(())
}

// Function to read lines from a file safely
fn read_lines<P>(filename: P) -> io::Result<io::Lines<io::BufReader<File>>>
where
    P: AsRef<Path>,
{
    let file = File::open(filename)?;
    Ok(io::BufReader::new(file).lines())
}
