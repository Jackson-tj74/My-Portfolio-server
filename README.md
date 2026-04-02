My Portfolio Backend

This is the backend server for My Portfolio, handling user signup, login, email verification, and email notifications. It is built with Node.js, Express, and MongoDB.

Features
User registration and login with JWT authentication
Email verification for new users
Sending emails via SMTP (Gmail)
Password hashing with bcrypt
Data validation using Joi
Session management with Express-session
MongoDB database integration
Environment Variables

Create a .env file in the backend root and set the following:

# Server configuration
PORT=3000
RANDOM_STRING_LENGTH=16
VERIFICATION_URL=http://localhost:3000/verify
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Email service
SMTP_HOST_PORT=587
SMTP_HOST=smtp.gmail.com
SMTP_GMAIL_SENDER_EMAIL=youremail@gmail.com
SMTP_GMAIL_SENDER_PASSWORD=yourpassword

Replace the placeholder values with your actual credentials. Keep this file secret.

Installation
Clone the repository:
git clone https://github.com/Jackson-tj74/My-Portfolio-server.git
Navigate to the backend folder:
cd My-Portfolio-server/server
Install dependencies:
npm install
Create a .env file as shown above.
Scripts
Command	Description
npm start	Start the server in production
npm run dev	Start the server in development mode with nodemon
Running the Server
Development Mode:
npm run dev
Production Mode:
npm start

The server will run on the port defined in your .env file (default 3000).

Technologies
Node.js
Express.js
MongoDB / Mongoose
Nodemailer (SMTP email)
Passport.js (Google OAuth 2.0)
Bcrypt
Joi for data validation
Express-session