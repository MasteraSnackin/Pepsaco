# Complete Setup Guide - PepsaCo Database Viewer

This guide provides detailed, step-by-step instructions for setting up and running the PepsaCo Database Viewer application.

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Initial Setup](#initial-setup)
3. [Database Configuration](#database-configuration)
4. [Running the Application](#running-the-application)
5. [Verifying Installation](#verifying-installation)
6. [Common Issues](#common-issues)
7. [Advanced Configuration](#advanced-configuration)

## 🖥️ System Requirements

### Required Software

- **Node.js**: Version 18.0.0 or higher
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`

- **npm**: Version 9.0.0 or higher (comes with Node.js)
  - Verify installation: `npm --version`

### Optional Software

- **Git**: For version control
- **VS Code**: Recommended code editor
- **DBeaver**: For direct database access (optional)

### System Specifications

- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: At least 500MB free
- **Network**: Internet connection required for database access

## 🚀 Initial Setup

### Step 1: Navigate to Project Directory

Open your terminal/command prompt and navigate to the project:

```bash
cd c:\Users\first\OneDrive\Desktop\Hackathon\Pepsaco\pepsaco-db-viewer
```

### Step 2: Install Dependencies

Install all required npm packages:

```bash
npm install
```

**Expected output:**
```
added 234 packages, and audited 235 packages in 45s
```

**What gets installed:**
- Next.js 14.0.4
- React 18.2.0
- TypeScript 5.3.3
- Tailwind CSS 3.4.0
- mssql 10.0.1
- chart.js 4.4.1
- And other dependencies...

### Step 3: Verify Installation

Check that all dependencies are installed correctly:

```bash
npm list --depth=0
```

You should see a list of all installed packages without errors.

## 🔐 Database Configuration

### Database Credentials

The application is pre-configured with the following credentials in `.env.local`:

```env
DB_HOST=pepsaco-db-standard.c1oqimeoszvd.eu-west-2.rds.amazonaws.com
DB_PORT=1433
DB_DATABASE=WideWorldImporters_Base
DB_USER=hackathon_ro_03
DB_PASSWORD=Z9@fLm2*
```

### Verify Database Access

**Option 1: Using the Application**
1. Start the application (see next section)
2. Navigate to http://localhost:3002
3. Click "View Tables" - if tables load, connection is successful

**Option 2: Using DBeaver (Optional)**
1. Open DBeaver
2. Create new SQL Server connection
3. Enter the credentials above
4. Select 'SQL Server Authentication'
5. Test Connection → Connect

### Security Notes

- ✅ Read-only access (SELECT queries only)
- ✅ SSL/TLS encrypted connection
- ✅ Parameterized queries prevent SQL injection
- ✅ No data modification possible

## 🎯 Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

**Expected output:**
```
> pepsaco-db-viewer@0.1.0 dev
> next dev -p 3002

  ▲ Next.js 14.0.4
  - Local:        http://localhost:3002
  - Network:      http://192.168.1.x:3002

 ✓ Ready in 2.3s
```

### Production Mode

Build and run in production mode:

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Accessing the Application

1. **Open your web browser**
2. **Navigate to**: http://localhost:3002
3. **You should see**: The PepsaCo Database Viewer home page

### Stopping the Application

- Press `Ctrl + C` in the terminal
- Or close the terminal window

## ✅ Verifying Installation

### Test Checklist

Follow these steps to verify everything works:

#### 1. Home Page
- [ ] Navigate to http://localhost:3002
- [ ] Verify the home page loads
- [ ] Check that "PepsaCo DB Viewer" appears in the header
- [ ] Confirm three feature cards are visible

#### 2. Tables Browser
- [ ] Click "View Tables" or navigate to http://localhost:3002/tables
- [ ] Verify tables list loads (should show 49 tables)
- [ ] Test search functionality by typing "Cities"
- [ ] Confirm table cards show schema and row count

#### 3. Data Viewer
- [ ] Click on any table (e.g., "Cities")
- [ ] Verify data loads in a table format
- [ ] Test pagination by clicking page numbers
- [ ] Test sorting by clicking column headers
- [ ] Verify row count is displayed

#### 4. Analytics Dashboard
- [ ] Click "Analytics" in the navigation
- [ ] Verify statistics cards display:
  - Total Tables: 49
  - Total Rows: ~3.8 billion
  - Average Rows/Table
- [ ] Confirm bar chart displays "Top 10 Tables by Row Count"

### Expected Results

If all tests pass:
- ✅ Database connection is working
- ✅ All features are functional
- ✅ Application is ready to use

## 🔧 Common Issues

### Issue 1: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3002
```

**Solution:**
```bash
# Option 1: Use a different port
npm run dev -- -p 3003

# Option 2: Kill the process using port 3002 (Windows)
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Option 2: Kill the process using port 3002 (Mac/Linux)
lsof -ti:3002 | xargs kill -9
```

### Issue 2: Database Connection Failed

**Error:**
```
Error: Failed to connect to database
```

**Solutions:**
1. **Check network connection**: Ensure you have internet access
2. **Verify credentials**: Check `.env.local` file has correct values
3. **Firewall**: Ensure port 1433 is not blocked
4. **VPN**: Try disconnecting/reconnecting VPN if applicable

### Issue 3: Module Not Found

**Error:**
```
Error: Cannot find module 'next'
```

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue 4: TypeScript Errors

**Error:**
```
Type error: Cannot find module...
```

**Solution:**
```bash
# Restart TypeScript server in VS Code
# Or rebuild the project
npm run build
```

### Issue 5: Slow Performance

**Symptoms:**
- Tables take long to load
- Data viewer is slow

**Solutions:**
1. **Check network speed**: Database is on AWS, requires good connection
2. **Reduce page size**: Use smaller pagination limits
3. **Clear browser cache**: Ctrl+Shift+Delete
4. **Restart application**: Stop and start the dev server

## ⚙️ Advanced Configuration

### Changing the Port

Edit `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -p 3003"
  }
}
```

### Adjusting Pagination

Edit `pepsaco-db-viewer/lib/queries.ts`:
```typescript
export async function getTableData(
  schemaName: string,
  tableName: string,
  page: number = 1,
  limit: number = 100, // Change from 50 to 100
  // ...
)
```

### Custom Database Connection

To connect to a different database, update `.env.local`:
```env
DB_HOST=your-server.database.windows.net
DB_PORT=1433
DB_DATABASE=YourDatabase
DB_USER=your-username
DB_PASSWORD=your-password
```

### Environment Variables

All available environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database server hostname | Required |
| `DB_PORT` | Database port | 1433 |
| `DB_DATABASE` | Database name | Required |
| `DB_USER` | Database username | Required |
| `DB_PASSWORD` | Database password | Required |
| `NODE_ENV` | Environment mode | development |

## 📊 Performance Tips

### For Better Performance

1. **Use production build** for better performance:
   ```bash
   npm run build
   npm start
   ```

2. **Enable caching** in your browser

3. **Close unused tabs** to free up memory

4. **Use wired connection** instead of WiFi for database access

### Monitoring Performance

Check the terminal for request times:
```
GET /api/tables 200 in 582ms
GET /api/table/Application.Cities 200 in 965ms
```

## 🆘 Getting Help

### Resources

- **README.md**: Main documentation
- **Project Structure**: See file organization in README
- **API Documentation**: Endpoint details in README

### Contact

For issues or questions:
- Check this guide first
- Review error messages in browser console (F12)
- Check terminal output for server errors

## 📝 Next Steps

After successful setup:

1. **Explore the database**: Browse different tables
2. **Test features**: Try sorting, filtering, pagination
3. **View analytics**: Check database statistics
4. **Customize**: Modify styling or add features as needed

## ✨ Success!

If you've completed all steps and tests pass, congratulations! Your PepsaCo Database Viewer is fully operational.

**Quick Start Commands:**
```bash
# Start development server
npm run dev

# Access application
# Open http://localhost:3002 in browser

# Stop server
# Press Ctrl+C in terminal
```

---

**Last Updated**: 2025-11-15  
**Version**: 1.0.0  
**Support**: PepsaCo Hackathon Team 3