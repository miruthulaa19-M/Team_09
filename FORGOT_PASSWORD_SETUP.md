# Forgot Password Setup Guide

## Nodemailer Configuration

To enable email functionality for password reset, you need to configure Gmail App Password:

### Step 1: Enable 2-Step Verification in Gmail
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification"

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or Other)
3. Click "Generate"
4. Copy the 16-character password (e.g., "xxxx xxxx xxxx xxxx")

### Step 3: Update backend/server.js

Replace these lines in `backend/server.js`:

```javascript
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your_email@gmail.com",        // Replace with your Gmail
    pass: "your_app_password_here"       // Replace with App Password (no spaces)
  }
});
```

Also update the `from` field in the email options:

```javascript
from: "your_email@gmail.com",  // Replace with your Gmail
```

### Step 4: Update JWT Secret (Optional but Recommended)

In `backend/server.js`, change:

```javascript
const JWT_SECRET = "your_secret_key_here_change_in_production";
```

To a strong random string (e.g., generated from https://randomkeygen.com/)

### Step 5: Restart Backend

```bash
cd backend
npm start
```

## Testing the Feature

1. Go to http://localhost:5173/vendor-login
2. Click "Forgot Password?"
3. Enter a registered email (must be @gmail.com)
4. Check your email inbox for the reset link
5. Click the link and reset your password

## Features Implemented

✅ Forgot Password link in Login page
✅ Email validation (@gmail.com only)
✅ Secure token generation (JWT, 15-min expiry)
✅ Email delivery with Nodemailer
✅ Token verification on reset page
✅ Password validation (6+ chars, letters + numbers)
✅ Confirm password matching
✅ One-time token usage
✅ Orange & White UI theme maintained
✅ Loading states and error handling
✅ Auto-redirect after success

## Database Schema Added

`reset_tokens` table:
- id (PRIMARY KEY)
- email (TEXT)
- token (TEXT UNIQUE)
- expires_at (INTEGER timestamp)
- used (INTEGER 0/1 flag)

## API Endpoints Added

- POST /api/forgot-password
- GET /api/reset-password/:token
- POST /api/reset-password/:token
