const request = require('supertest');  // To make HTTP requests
const { app } = require('../index');  // Import the app from your index.js file
const { User } = require('../db');  // Import your User model

// Jest test suite for the /create-user endpoint
describe('POST /create-user', () => {
  // Before each test, we can ensure the database is clean.
  // beforeAll(async () => {
  //   // You could truncate or reset your test database here, if necessary
  //   await User.destroy({ where: {} });  // Clears all users before tests
  // });

  it('should create a new user and return 201 status', async () => {
    const response = await request(app)
      .post('/create-user')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securepassword123',
        is_manager: true,
        is_admin: false,
      })
      .expect(201);  // Expecting status code 201 (created)

    // Check that the response contains the correct user data
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('John Doe');
    expect(response.body.email).toBe('john.doe@example.com');
    expect(response.body.is_manager).toBe(true);
    expect(response.body.is_admin).toBe(false);
  });

  it('should return 400 if email is already in use', async () => {
    // Create a user first
    await request(app)
      .post('/create-user')
      .send({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'securepassword123',
        is_manager: false,
        is_admin: false,
      });

    // Try to create another user with the same email
    const response = await request(app)
      .post('/create-user')
      .send({
        name: 'John Doe',
        email: 'jane.doe@example.com',
        password: 'newpassword123',
        is_manager: true,
        is_admin: true,
      })
      .expect(400);  // Expecting status code 400 (bad request)

    expect(response.body.message).toBe('Email already in use.');
  });

  it('should return 400 if required fields are missing', async () => {
    const response = await request(app)
      .post('/create-user')
      .send({
        name: '',  // Missing name
        email: '', // Missing email
        password: '', // Missing password
      })
      .expect(400);  // Expecting status code 400

    expect(response.body.message).toBe('Name, email, and password are required.');
  });
});
