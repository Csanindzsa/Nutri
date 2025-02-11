use rusqlite::{params, Connection, Result};
use serde_json::json;
use std::fs::File;
use std::io::{self, BufRead};
use std::path::Path;

fn main() -> Result<()> {
    let db_path = r"C:\Users\csabi\Desktop\Nutri\django_backend\db.sqlite3";
    
    // Open SQLite connection
    let conn = Connection::open(db_path)?;
    
    // Enable WAL mode to prevent locking issues
    let _: String = conn.query_row("PRAGMA journal_mode=WAL;", [], |row| row.get(0))?;

    // Read restaurant names from file and insert them
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

    // Read foods from CSV and insert them
    let foods_file = "foods.csv";
    if let Ok(lines) = read_lines(foods_file) {
        for (index, line) in lines.enumerate() {
            if let Ok(data) = line {
                if index == 0 {
                    continue; // Skip header
                }
                let parts: Vec<&str> = data.split(';').collect();
                if parts.len() == 21 {
                    let restaurant_id = parts[0].trim().parse::<i32>().unwrap_or(1);
                    let name = parts[1].trim();

                    let macro_table = json!({
                        "energy_kcal": parts[2].trim().parse::<i32>().unwrap_or(0),
                        "fat": {
                            "per100g": parts[3].trim().parse::<f32>().unwrap_or(0.0),
                            "percentage": parts[4].trim().parse::<f32>().unwrap_or(0.0),
                        },
                        "saturated_fat": {
                            "per100g": parts[5].trim().parse::<f32>().unwrap_or(0.0),
                            "percentage": parts[6].trim().parse::<f32>().unwrap_or(0.0),
                        },
                        "carbohydrates": {
                            "per100g": parts[7].trim().parse::<f32>().unwrap_or(0.0),
                            "percentage": parts[8].trim().parse::<f32>().unwrap_or(0.0),
                        },
                        "sugars": {
                            "per100g": parts[9].trim().parse::<f32>().unwrap_or(0.0),
                            "percentage": parts[10].trim().parse::<f32>().unwrap_or(0.0),
                        },
                        "protein": {
                            "per100g": parts[11].trim().parse::<f32>().unwrap_or(0.0),
                            "percentage": parts[12].trim().parse::<f32>().unwrap_or(0.0),
                        },
                        "fiber": {
                            "per100g": parts[13].trim().parse::<f32>().unwrap_or(0.0),
                            "percentage": parts[14].trim().parse::<f32>().unwrap_or(0.0),
                        },
                        "salt": {
                            "per100g": parts[15].trim().parse::<f32>().unwrap_or(0.0),
                            "percentage": parts[16].trim().parse::<f32>().unwrap_or(0.0),
                        }
                    });

                    let is_organic = parts[17].trim().parse::<bool>().unwrap_or(false);
                    let is_gluten_free = parts[18].trim().parse::<bool>().unwrap_or(false);
                    let is_alcohol_free = parts[19].trim().parse::<bool>().unwrap_or(false);
                    let is_lactose_free = parts[20].trim().parse::<bool>().unwrap_or(false);

                    insert_food(&conn, restaurant_id, name, &macro_table.to_string(), is_organic, is_gluten_free, is_alcohol_free, is_lactose_free)?;
                } else {
                    eprintln!("Skipping invalid line in foods.csv: {}", data);
                }
            }
        }
    }

    println!("Data inserted successfully!");
    Ok(())
}

// Function to insert a restaurant
fn insert_restaurant(conn: &Connection, name: &str) -> Result<()> {
    conn.execute("INSERT OR IGNORE INTO restaurants (name, foods_on_menu) VALUES (?1, 0)", params![name])?;
    println!("Inserted restaurant: {}", name);
    Ok(())
}

// Function to insert a food item with JSON macro_table and boolean values
fn insert_food(conn: &Connection, restaurant_id: i32, name: &str, macro_table: &str, is_organic: bool, is_gluten_free: bool, is_alcohol_free: bool, is_lactose_free: bool) -> Result<()> {
    conn.execute(
        "INSERT OR IGNORE INTO foods (restaurant_id, name, macro_table, is_organic, is_gluten_free, is_alcohol_free, is_lactose_free) 
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![restaurant_id, name, macro_table, is_organic, is_gluten_free, is_alcohol_free, is_lactose_free],
    )?;
    println!("Inserted food: {} (Restaurant ID: {})", name, restaurant_id);
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
