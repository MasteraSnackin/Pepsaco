# User Guide - PepsaCo Database Viewer

Complete guide to using all features of the PepsaCo Database Viewer application.

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Home Page](#home-page)
3. [Tables Browser](#tables-browser)
4. [Data Viewer](#data-viewer)
5. [Analytics Dashboard](#analytics-dashboard)
6. [Tips & Tricks](#tips--tricks)
7. [Keyboard Shortcuts](#keyboard-shortcuts)

## 🚀 Getting Started

### Accessing the Application

1. Ensure the application is running (`npm run dev`)
2. Open your browser
3. Navigate to: **http://localhost:3002**

### Navigation

The application has three main sections accessible from the top navigation bar:

- **🏠 Home** - Overview and quick access
- **📊 Tables** - Browse all database tables
- **📈 Analytics** - View database statistics

## 🏠 Home Page

### Overview

The home page provides:
- Welcome message
- Quick access cards to main features
- Database connection information

### Quick Access Cards

#### 1. Browse Tables
- **Purpose**: View all available database tables
- **Action**: Click "View Tables →"
- **Takes you to**: Tables browser page

#### 2. Analytics
- **Purpose**: View database statistics and visualizations
- **Action**: Click "View Analytics →"
- **Takes you to**: Analytics dashboard

#### 3. Database Info
- **Shows**: 
  - Database name: WideWorldImporters_Base
  - Access level: Read-only
- **No action required**: Informational only

### Features List

The home page also displays a list of available features:
- ✓ Browse all database tables
- ✓ View table data with pagination
- ✓ Sort and filter data
- ✓ Search across tables
- ✓ View database analytics
- ✓ Secure read-only access

## 📊 Tables Browser

### Accessing Tables

**Method 1**: Click "View Tables" on home page  
**Method 2**: Click "Tables" in navigation bar  
**Method 3**: Navigate to http://localhost:3002/tables

### Features

#### Search Tables
1. Locate the search box at the top
2. Type any part of a table name
3. Results filter in real-time
4. Clear search to see all tables

**Example searches:**
- "Cities" - finds Cities, Cities_Archive
- "Customer" - finds CustomerTransactions, Customers
- "Order" - finds Orders, OrderLines

#### Table Cards

Each table is displayed as a card showing:
- **Table Icon**: Visual indicator
- **Table Name**: Full name of the table
- **Schema**: Database schema (e.g., Application, Sales)
- **Row Count**: Number of rows in the table

#### Viewing Table Data

1. Click on any table card
2. You'll be taken to the Data Viewer
3. Table data loads automatically

### Understanding Schemas

Tables are organized by schema:
- **Application**: Application-level data (Cities, Countries, etc.)
- **Sales**: Sales-related data (Orders, Customers, etc.)
- **Purchasing**: Purchasing data (Suppliers, etc.)
- **Warehouse**: Warehouse data (StockItems, etc.)

## 📋 Data Viewer

### Accessing Data

1. Click any table from the Tables Browser
2. Or navigate directly: http://localhost:3002/data/[Schema].[TableName]

### Page Layout

#### Header Section
- **Back Button**: Return to Tables Browser
- **Table Name**: Shows schema and table name (e.g., "Application.Cities")
- **Row Counter**: Shows current page range and total rows
- **Rows Per Page**: Dropdown to change page size (50, 100, 200)

#### Data Table
- **Column Headers**: Click to sort
- **Data Rows**: Actual table data
- **Pagination Controls**: Navigate between pages

### Features

#### 1. Viewing Data

**What you see:**
- All columns from the selected table
- Up to 50 rows per page (default)
- Data formatted for readability

**Data Types:**
- Text: Displayed as-is
- Numbers: Right-aligned
- Dates: Formatted timestamps
- Objects: Shown as [object Object]

#### 2. Pagination

**Controls:**
- **First Page**: Jump to page 1
- **Previous**: Go back one page
- **Page Numbers**: Click specific page
- **Next**: Go forward one page
- **Last Page**: Jump to final page

**Page Information:**
- Shows: "Showing 1 to 50 of 37,940 rows"
- Updates as you navigate

**Changing Page Size:**
1. Click the "50 per page" dropdown
2. Select: 50, 100, or 200 rows
3. Page reloads with new size

#### 3. Sorting Data

**How to Sort:**
1. Click any column header
2. First click: Ascending order (↑)
3. Second click: Descending order (↓)
4. Third click: Remove sorting

**Sort Indicators:**
- ↑ Arrow up: Ascending (A-Z, 0-9)
- ↓ Arrow down: Descending (Z-A, 9-0)

**Examples:**
- Sort "CityName" alphabetically
- Sort "Population" by size
- Sort "LastEditedWhen" by date

#### 4. Filtering Data

**Column Filters:**
1. Look for search boxes under column headers
2. Type to filter that column
3. Results update in real-time
4. Clear filter to see all data

**Filter Tips:**
- Filters are case-insensitive
- Partial matches work (e.g., "New" finds "New York")
- Multiple filters work together (AND logic)
- Clear all filters to reset

**Example Filters:**
- CityName: "London" - shows all London cities
- StateProvinceID: "1" - shows cities in state 1
- Population: "1000000" - shows cities with 1M+ population

### Navigation Tips

**Quick Navigation:**
- Use browser back button to return to Tables
- Bookmark specific tables for quick access
- Use keyboard: Tab to navigate, Enter to click

**Performance:**
- Large tables may take longer to load
- Reduce page size if experiencing slowness
- Sorting and filtering happen server-side

## 📈 Analytics Dashboard

### Accessing Analytics

**Method 1**: Click "View Analytics" on home page  
**Method 2**: Click "Analytics" in navigation bar  
**Method 3**: Navigate to http://localhost:3002/analytics

### Dashboard Sections

#### 1. Statistics Cards

**Total Tables**
- Shows: Number of tables in database (49)
- Icon: Bar chart
- Updates: Real-time from database

**Total Rows**
- Shows: Sum of all rows across all tables
- Format: Formatted with commas (e.g., 3,794,028,190)
- Icon: Bar chart

**Avg Rows/Table**
- Shows: Average number of rows per table
- Calculation: Total Rows ÷ Total Tables
- Format: Formatted with commas

#### 2. Top 10 Tables Chart

**What it Shows:**
- Bar chart of 10 largest tables by row count
- Table names on Y-axis
- Row counts on X-axis
- Color-coded bars (blue gradient)

**How to Read:**
1. Longest bar = Most rows
2. Hover over bars for exact counts
3. Tables listed in descending order

**Example Data:**
1. ColdRoomTemperatures_Archive: 3,764,583 rows
2. StockItemTransactions: 237,500 rows
3. OrderLines: 232,229 rows
... and so on

### Using Analytics

**Insights You Can Gain:**
- Which tables have the most data
- Overall database size
- Data distribution across tables
- Identify large tables for optimization

**Refresh Data:**
- Analytics update automatically on page load
- Refresh browser (F5) to get latest data
- Data is pulled fresh from database each time

## 💡 Tips & Tricks

### Performance Tips

1. **Faster Loading**
   - Use smaller page sizes for large tables
   - Avoid sorting very large tables
   - Use specific filters to reduce data

2. **Better Navigation**
   - Bookmark frequently used tables
   - Use search to find tables quickly
   - Remember schema names for faster access

3. **Efficient Filtering**
   - Start with specific filters
   - Combine multiple filters for precision
   - Clear filters when done

### Best Practices

1. **Data Exploration**
   - Start with Analytics to understand database
   - Browse Tables to see what's available
   - Use Data Viewer for detailed inspection

2. **Working with Large Tables**
   - Check row count before opening
   - Use filters to narrow down data
   - Consider using smaller page sizes

3. **Finding Specific Data**
   - Use table search to find relevant tables
   - Use column filters to find specific records
   - Sort to find min/max values

### Common Workflows

#### Workflow 1: Exploring New Database
1. Visit Analytics to see overview
2. Note largest tables
3. Browse Tables to see all available
4. Open interesting tables to view data

#### Workflow 2: Finding Specific Data
1. Search for table name in Tables Browser
2. Open the table
3. Use column filters to narrow down
4. Sort to organize results

#### Workflow 3: Comparing Tables
1. Open first table, note row count
2. Use back button to return
3. Open second table
4. Compare data structures and sizes

## ⌨️ Keyboard Shortcuts

### Browser Shortcuts

- **Ctrl + R** or **F5**: Refresh page
- **Ctrl + F**: Find on page
- **Ctrl + +**: Zoom in
- **Ctrl + -**: Zoom out
- **Ctrl + 0**: Reset zoom

### Navigation Shortcuts

- **Alt + ←**: Browser back
- **Alt + →**: Browser forward
- **Ctrl + L**: Focus address bar
- **Ctrl + T**: New tab

### Application Navigation

- **Tab**: Move to next element
- **Shift + Tab**: Move to previous element
- **Enter**: Click focused element
- **Esc**: Close modals/dialogs

## 🔍 Search Tips

### Table Search
- **Exact match**: Type full table name
- **Partial match**: Type part of name
- **Case insensitive**: Works with any case
- **Real-time**: Results as you type

### Data Filtering
- **Contains**: Finds partial matches
- **Multiple words**: Searches for all words
- **Numbers**: Exact or partial matches
- **Dates**: Format as shown in data

## 📊 Understanding Data

### Data Types

**Text/String**
- Displayed as plain text
- Can be sorted alphabetically
- Filterable by partial match

**Numbers**
- Right-aligned in tables
- Sortable numerically
- Filterable by value

**Dates/Timestamps**
- Formatted: YYYY-MM-DD HH:MM:SS
- Sortable chronologically
- Filterable by date parts

**Objects/JSON**
- Shown as [object Object]
- May need external tools to view
- Not directly filterable

### Null Values

- Displayed as empty cells
- Sorted to end of list
- Can be filtered (search for empty)

## 🆘 Troubleshooting

### Data Not Loading

**Symptoms**: Blank table or loading spinner
**Solutions**:
1. Check internet connection
2. Refresh the page (F5)
3. Try a different table
4. Check browser console (F12) for errors

### Slow Performance

**Symptoms**: Pages take long to load
**Solutions**:
1. Reduce page size (50 instead of 200)
2. Use filters to reduce data
3. Avoid sorting very large tables
4. Close other browser tabs

### Search Not Working

**Symptoms**: Search doesn't filter results
**Solutions**:
1. Clear search and try again
2. Check spelling
3. Try partial match instead of exact
4. Refresh the page

### Sorting Issues

**Symptoms**: Sort doesn't work as expected
**Solutions**:
1. Click column header again
2. Clear other sorts first
3. Refresh the page
4. Try different column

## 📚 Additional Resources

- **README.md**: Technical documentation
- **SETUP_GUIDE.md**: Installation instructions
- **QUICK_START.md**: Fast setup guide

## 🎓 Learning Path

### Beginner
1. Start with Home page
2. Explore Analytics
3. Browse Tables
4. Open a small table
5. Try pagination

### Intermediate
1. Use search to find tables
2. Apply filters to data
3. Sort columns
4. Compare different tables
5. Understand schemas

### Advanced
1. Combine multiple filters
2. Analyze large tables efficiently
3. Use Analytics for insights
4. Bookmark favorite tables
5. Optimize workflow

---

**Questions?** Check the troubleshooting section or refer to SETUP_GUIDE.md for technical issues.

**Last Updated**: 2025-11-15  
**Version**: 1.0.0