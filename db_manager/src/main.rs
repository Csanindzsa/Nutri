use rusqlite::{params, Connection, Result};
use std::fs::File;
use std::io::{self, BufRead};
use std::path::Path;

fn main() -> Result<()> {
    let db_path = r"C:\Users\csabi\Desktop\Nutri\django_backend\db.sqlite3";
    
    // Open SQLite connection
    let conn = Connection::open(db_path)?;
    
    // Enable WAL mode to prevent locking issues
    conn.prepare("PRAGMA journal_mode=WAL;")?;

    // Create the Restaurant table if it doesn't exist
    // create_table(&conn)?;

    // Read restaurant names from file
    let file_path = "restaurants.txt";
    if let Ok(lines) = read_lines(file_path) {
        for line in lines {
            if let Ok(name) = line {
                if !name.trim().is_empty() { // Avoid inserting empty lines
                    insert_restaurant(&conn, &name)?;
                }
            }
        }
    }

    println!("Restaurants inserted successfully!");
    Ok(())
}

// Function to create the Restaurant table (Check table name in SQLite!)
fn create_table(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS Restaurants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )",
        [],
    )?;
    Ok(())
}

// Function to insert a restaurant name safely
fn insert_restaurant(conn: &Connection, name: &str) -> Result<()> {
    conn.execute("INSERT INTO restaurants (name, foods_on_menu) VALUES (?1, 0)", params![name])?;
    println!("Inserted: {}", name);
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
