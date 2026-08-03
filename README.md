# My Portfolio Backend

This is the backend server for My Portfolio, handling user signup, login, email notifications, contact messages, portfolio content management, real-time notifications, and an AI portfolio assistant. It is built with Node.js, Express, and MongoDB.

## Features

- User registration and login with JWT authentication
- Email notifications via Resend API
- Contact-message management with admin reply
- Newsletter subscriptions
- Portfolio content CRUD (projects, services, skills, experience, education, certificates, testimonials, gallery, settings)
- Real-time notifications via Socket.IO
- AI portfolio assistant with OpenAI-compatible LLM integration
- Password hashing with bcrypt
- Data validation using Joi
- Cloudinary media uploads
- Security headers, rate limiting, and NoSQL injection prevention
- CORS configured for Netlify frontend and local development

## Environment Variables

Create a `.env` file in the project root and set the following:

```env
# Server configuration
PORT=3000
NODE_ENV=production
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname
CLIENT_URL=https://tjdevsphere.netlify.app
ALLOWED_ORIGINS=https://tjdevsphere.netlify.app,http://localhost:5173,http://localhost:4173
SECRET_KEY=generate-a-random-secret-with-at-least-32-characters
PROVIDER_SETUP_KEY=generate-a-separate-setup-key
PORTFOLIO_URL=https://tjdevsphere.netlify.app

# Email service (Resend API)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=Acme <onboarding@resend.dev>
ADMIN_EMAIL=youremail@example.com
AI_FEEDBACK_EMAIL=youremail@example.com

# OpenAI-compatible LLM endpoint (for example Groq or another provider)
LLM_API_URL=https://api.groq.com/openai/v1/chat/completions
LLM_API_KEY=your-api-key
LLM_MODEL=llama-3.3-70b-versatile

# Required when dashboard images are uploaded
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_SECRET_KEY=your-api-secret
```

Replace the placeholder values with your actual credentials. Keep this file secret.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Jackson-tj74/My-Portfolio-server.git
   ```
2. Navigate to the project folder:
   ```bash
   cd My-Portfolio-server
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file as shown above.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the server in production |
| `npm run dev` | Start the server in development mode with nodemon |

## Running the Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

The server will run on the port defined in your `.env` file (default 3000).

## Deploying to Render

1. Push your code to GitHub.
2. In Render, create a new **Web Service** and connect your repository.
3. Configure the service:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Node Version:** 18 or higher (set in `engines` in `package.json`)
4. Add all environment variables from your `.env` file in the Render dashboard.
5. Deploy. Render will automatically set `PORT` for you.

## CORS Configuration

The backend allows requests from:
- `https://tjdevsphere.netlify.app` (production frontend)
- `http://localhost:5173` (local Vite dev server)
- `http://localhost:4173` (local Vite preview)

These are configured via `CLIENT_URL`, `ALLOWED_ORIGINS`, and the hardcoded production URL in `src/server.js`.

## Technologies

- Node.js
- Express.js
- MongoDB / Mongoose
- Resend (email delivery API)
- Socket.IO (real-time notifications)
- Bcrypt
- Joi for data validation
- Cloudinary (media uploads)
- Helmet (security headers)
- Compression (gzip responses) 
