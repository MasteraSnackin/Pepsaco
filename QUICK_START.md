# Quick Start Guide

Get the PepsaCo Database Viewer running in 3 minutes!

## ⚡ Fast Setup (3 Steps)

### 1️⃣ Navigate to Project
```bash
cd pepsaco-db-viewer
```

### 2️⃣ Install Dependencies
```bash
npm install
```
⏱️ Takes ~1-2 minutes

### 3️⃣ Start Application
```bash
npm run dev
```

### 4️⃣ Open Browser
Navigate to: **http://localhost:3002**

## ✅ That's It!

The application is now running and connected to the database.

## 🎯 What You Can Do

### Browse Tables
- Click **"View Tables"** or **"Tables"** in navigation
- Search for specific tables
- Click any table to view its data

### View Data
- See table contents with pagination
- Sort columns by clicking headers
- Filter data using search boxes
- Navigate through pages

### See Analytics
- Click **"Analytics"** in navigation
- View database statistics
- See top tables by row count
- Interactive charts

## 🔧 Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Stop server
Ctrl + C
```

## 📊 Database Info

- **Database**: WideWorldImporters_Base
- **Tables**: 49 tables
- **Access**: Read-only
- **Location**: AWS RDS (EU West 2)

## 🆘 Quick Troubleshooting

### Port Already in Use?
```bash
npm run dev -- -p 3003
```

### Connection Issues?
1. Check internet connection
2. Verify `.env.local` exists
3. Restart the server

### Need to Reinstall?
```bash
rm -rf node_modules
npm install
```

## 📚 More Help

- **Detailed Setup**: See `SETUP_GUIDE.md`
- **Full Documentation**: See `README.md`
- **Project Structure**: See `README.md` → Project Structure

## 🎉 Success Indicators

✅ Terminal shows: `Ready in X.Xs`  
✅ Browser loads home page  
✅ Tables page shows 49 tables  
✅ Data loads when clicking a table  
✅ Analytics shows statistics  

---

**Need more details?** Check `SETUP_GUIDE.md` for comprehensive instructions.