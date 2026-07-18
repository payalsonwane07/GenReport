# ReportGen - Complete Setup & Run Guide

## ✅ SECURITY VERIFICATION
- ✅ **NO hardcoded secrets** - All secrets are in `.env` file (not committed)
- ✅ **NO paid services used** - Only free/open-source libraries
- ✅ **NO AWS/Firebase/Stripe** - Using only MongoDB Atlas free tier
- ✅ **NO exposed credentials** - `.env` is in `.gitignore`

## 📋 Prerequisites

### Required Software
- Node.js (v14+) and npm
- Git
- MongoDB Atlas account (free tier) - https://www.mongodb.com/cloud/atlas

### Get MongoDB URI
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster (M0 tier)
3. Get connection string in format: `mongodb+srv://username:password@cluster.mongodb.net/reportgen?retryWrites=true&w=majority`

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output - you'll need it for the `.env` file.

## 🚀 Setup Instructions

### Step 1: Setup Backend

```bash
# Navigate to backend directory
cd node_backend

# Install dependencies
npm install

# Create .env file with your values
# Copy .env.example and fill in your values:
cp .env.example .env

# Edit .env and add:
# - MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/reportgen?retryWrites=true&w=majority
# - JWT_SECRET=<output from command above>
# - PORT=5001
# - NODE_ENV=development

# Create necessary directories
mkdir -p uploads generated reports

# Test backend is working
npm run dev
```

Expected output: Server running on port 5001

### Step 2: Setup Frontend

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Expected output: Local development server running at http://localhost:5173 or http://localhost:3001

### Step 3: Access the App

1. Open browser: http://localhost:5173 (or the port shown)
2. Click "Create Account" or use Register
3. Create account with test credentials:
   - Name: Test User
   - Email: test@example.com
   - Password: TestPassword123

## 📝 API Endpoints

All endpoints are protected with JWT authentication.

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Reports
- `POST /api/reports/upload` - Upload CSV/Excel/JSON files
- `GET /api/reports` - List all reports for user
- `GET /api/reports/:id` - Get specific report
- `POST /api/reports/:id/generate` - Regenerate report
- `GET /api/reports/:id/download` - Download PDF
- `DELETE /api/reports/:id` - Delete report

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🧪 Testing the App

### Test File Upload
1. Go to Upload page
2. Upload sample CSV/Excel file
3. See processing status
4. Charts and analysis display automatically

### Test Report Generation
1. After upload completes, view analysis page
2. See interactive charts (bar, line, pie)
3. View data preview and statistics
4. Download PDF button

### Test Reports History
1. Go to Reports page
2. See all previously generated reports
3. Download any completed report
4. Delete reports as needed

### Test Authentication
1. Logout and try to access Upload page
2. Should redirect to Login
3. Login with your credentials
4. Should access protected pages

## 📁 Folder Structure

```
automated-report-generator/
├── node_backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── config/
│   ├── uploads/              # Uploaded files
│   ├── generated/            # Generated PDFs
│   ├── reports/              # Report files
│   ├── .env                  # SECRETS (NOT in git)
│   ├── .env.example          # Template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── .gitignore               # Prevents .env from being committed
```

## 🔐 Environment Variables Reference

### Backend (.env file)

```
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/reportgen?retryWrites=true&w=majority

# Server
PORT=5001
NODE_ENV=development

# JWT
JWT_SECRET=<your-generated-secret-key>

# CORS (optional)
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:5173
```

### Frontend (.env files are usually in vite.config.ts)

```typescript
// vite.config.ts has API URL configured
// Default: http://localhost:5001/api
```

## 🔧 Available NPM Commands

### Backend
```bash
npm run dev      # Start development server with auto-reload
npm start        # Start production server
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 📊 Features Implemented

✅ **File Upload**
- Support for CSV, Excel (.xlsx), JSON
- Drag & drop interface
- Progress bar during upload
- File validation

✅ **Data Analysis**
- Automatic data parsing
- Summary statistics
- Column detection
- Data type inference

✅ **Interactive Charts** (using Recharts)
- Bar chart for category comparisons
- Line chart for trends
- Pie chart for distributions
- Hover tooltips
- Responsive design

✅ **PDF Report Generation** (using pdfkit)
- Professional PDF layout
- Includes statistics and charts insights
- Data preview table
- User information
- Timestamp

✅ **Reports History**
- List all user reports
- Status tracking (pending/completed/failed)
- Download completed reports
- Delete reports and clean up files

✅ **User Authentication**
- Email/Password signup
- JWT token-based login
- Protected routes
- Session persistence
- Auto-logout on token expiry

✅ **Dashboard**
- Overview statistics
- Recent reports list
- Quick action buttons
- Report status summary

✅ **Error Handling**
- User-friendly error messages
- File validation errors
- Network error handling
- Database error logging

✅ **Theme Support**
- Light/Dark mode toggle
- Persistent theme preference
- System theme detection

## ⚠️ IMPORTANT SECURITY REMINDERS

1. **NEVER commit .env file to GitHub**
   - It's in .gitignore - verify it's not committed
   - Use .env.example for reference

2. **NEVER hardcode secrets in code**
   - All secrets go in .env file
   - Never push credentials to repositories

3. **Use strong JWT_SECRET**
   - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Use at least 32 characters

4. **MongoDB Free Tier Limits**
   - 512MB storage
   - No backups
   - Good for development/testing
   - For production, upgrade cluster

5. **File Upload Security**
   - Only CSV, Excel, JSON allowed
   - Files are stored locally in `/uploads`
   - PDFs stored in `/generated`
   - User can delete uploaded files anytime

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### MongoDB connection failed
- Check MONGODB_URI format
- Verify IP address is whitelisted in Atlas
- Check database credentials
- Test with: `node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI, console.log)"`

### Port already in use
```bash
# Backend (find process on port 5001)
lsof -i :5001
kill -9 <PID>

# Frontend (find process on port 5173)
lsof -i :5173
kill -9 <PID>
```

### JWT token errors
- Ensure JWT_SECRET is set in .env
- Token expires in 7 days by default
- Check browser localStorage for authToken

### Charts not showing
- Ensure recharts is installed: `npm install recharts`
- Check browser console for errors
- Verify data is being returned from API

## 📞 Support

For issues:
1. Check console for error messages
2. Verify .env file has all required variables
3. Check MongoDB connection
4. Verify ports 5001 and 5173 are not in use
5. Clear browser cache and localStorage

## ✅ Verification Checklist

Before running the app:

- [ ] MongoDB Atlas account created and cluster running
- [ ] MongoDB URI copied to .env file
- [ ] JWT_SECRET generated and in .env file
- [ ] `.env` file created and NOT committed to git
- [ ] `/uploads`, `/generated`, `/reports` directories exist in node_backend
- [ ] Backend dependencies installed: `npm install` in node_backend
- [ ] Frontend dependencies installed: `npm install` in frontend
- [ ] Backend starts without errors: `npm run dev` in node_backend
- [ ] Frontend starts without errors: `npm run dev` in frontend
- [ ] Can access http://localhost:5173
- [ ] Can create account and login
- [ ] Can upload CSV/Excel/JSON files
- [ ] Charts display after upload
- [ ] Can download PDF reports
- [ ] Can delete reports

## 🎉 You're All Set!

The app is now ready to use. Start generating reports!

### Quick Start
1. Terminal 1: `cd node_backend && npm run dev`
2. Terminal 2: `cd frontend && npm run dev`
3. Open http://localhost:5173
4. Create account → Upload file → View analysis → Download PDF
