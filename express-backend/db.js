const { Sequelize, DataTypes, Model } = require('sequelize');

const USERNAME = "root";
const PASSWORD = "";
const ADDRESS = "localhost";
const PORT = "3306";
const DB = "nutri_db";

// Establish a Sequelize connection (you'll need to replace with your DB credentials)
const sequelize = new Sequelize(`mysql://${USERNAME}:${PASSWORD}@${ADDRESS}:${PORT}/${DB}`, {
  dialect: 'mysql',
  logging: false, // Disable logging for clarity
});

// Define the User model
class User extends Model {}
User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  is_manager: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: false,
});

// Define the Ingredient model
class Ingredient extends Model {}
Ingredient.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  hazard_level: {
    type: DataTypes.ENUM('0', '1', '2', '3'), // Enum for hazard levels
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Ingredient',
  tableName: 'ingredients',
  timestamps: false,
});

// Define the Food model
class Food extends Model {}
Food.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  macro_table: {
    type: DataTypes.JSON,
    allowNull: true, // Store JSON data for macro info
  },
}, {
  sequelize,
  modelName: 'Food',
  tableName: 'foods',
  timestamps: false,
});

// Define the many-to-many relationship between Food and Ingredient
Food.belongsToMany(Ingredient, { through: 'FoodIngredients' });
Ingredient.belongsToMany(Food, { through: 'FoodIngredients' });

// Sync the models with the database (this creates the tables if they don't exist)
async function syncModels() {
  try {
    await sequelize.sync({ force: true }); // force: true will drop and recreate the tables
    console.log('Database synced successfully.');
  } catch (error) {
    console.error('Error syncing the database:', error);
  }
}

// Call syncModels() to ensure the tables are created when this file is run
syncModels();

module.exports = {
  sequelize,
  User,
  Food,
  Ingredient,
};
