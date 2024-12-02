const express = require('express');
const { User, Ingredient, Food } = require('./db'); // Import the User model from db.js
const bcrypt = require('bcrypt'); // For password hashing
const bodyParser = require('body-parser');

// Initialize express application
const app = express();

// Use body-parser middleware to parse incoming JSON requests
app.use(bodyParser.json());

// POST endpoint to create a new user
app.post('/create-user', async (req, res) => {
  const { name, email, password, is_manager = false, is_admin = false } = req.body;

  // Input validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    // Check if a user already exists with the same email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use.' });
    }

    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user in the database
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      is_manager,
      is_admin,
    });

    // Respond with the newly created user's data (excluding the password)
    return res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      is_manager: newUser.is_manager,
      is_admin: newUser.is_admin,
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// Set the port and start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


module.exports = {app}