# PepsaCo Database Viewer

A modern, full-stack web application for viewing and analyzing data from the WideWorldImporters SQL Server database. Built with Next.js 14, TypeScript, and Tailwind CSS.


Youtube video:
https://youtu.be/t1tCLjmBM7w


## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 3 minutes
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed installation and configuration
- **[USER_GUIDE.md](./USER_GUIDE.md)** - Complete guide to using all features
- **[DATA_ANALYSIS.md](./DATA_ANALYSIS.md)** - Dataset overview and use cases
- **[SETTINGS_GUIDE.md](./SETTINGS_GUIDE.md)** - Configure Gemini API key via UI
- **[GEMINI_MIGRATION.md](./GEMINI_MIGRATION.md)** - OpenAI to Gemini migration guide
- **[AI_INTEGRATION_GUIDE.md](./AI_INTEGRATION_GUIDE.md)** - AI features and strategy
- **[README.md](./README.md)** - This file (technical overview)

##  Features

### Core Features
- **📊 Database Browser**: Browse all tables with schema information and row counts
- **🔍 Data Viewer**: View table data with pagination, sorting, and filtering
- **📈 Analytics Dashboard**: Visualize database statistics with interactive charts
- **💼 Sales Dashboard**: Track sales performance and trends
- **📦 Inventory Management**: Monitor stock levels and movements
- **❄️ Cold Chain Monitoring**: Track temperature-sensitive products
- **🔧 Query Builder**: Build and execute custom SQL queries

### AI-Powered Features (Gemini)
- **🤖 Natural Language Queries**: Convert plain English to SQL
- **💡 Business Insights**: Automated analysis and recommendations
- **📊 Executive Summaries**: High-level business intelligence
- **🚨 Smart Alerts**: Anomaly detection and proactive notifications
- **⚙️ Settings Page**: Easy API key configuration via UI

### Technical Features
- **🔒 Read-Only Access**: Safe database exploration without modification risks
- **⚡ Fast Performance**: Server-side rendering and optimized queries
- **🎨 Modern UI**: Clean, responsive design with Tailwind CSS
- **🔐 Secure**: Environment-based configuration and encrypted connections

## 📋 Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Access to the WideWorldImporters database (credentials provided)

## 🛠️ Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd pepsaco-db-viewer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   
   The `.env.local` file is already configured with the database credentials:
   ```env
   DB_HOST=pepsaco-db-standard.c1oqimeoszvd.eu-west-2.rds.amazonaws.com
   DB_PORT=1433
   DB_DATABASE=WideWorldImporters_Base
   DB_USER=hackathon_ro_03
   DB_PASSWORD=Z9@fLm2*
   ```

   **For AI Features**: Add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your-api-key-here
   ```
   
   Or use the **Settings page** (recommended) to configure it via the UI after starting the server.

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3002](http://localhost:3002)

## 🎯 Usage

### Home Page
- Overview of the database viewer features
- Quick access to Tables and Analytics sections
- Database connection information

### Tables Browser
- View all database tables organized by schema
- Search tables by name
- See row counts for each table
- Click any table to view its data

### Data Viewer
- Browse table data with pagination (50 rows per page)
- Sort columns in ascending or descending order
- Filter data using column-specific search
- Navigate through large datasets efficiently

### Analytics Dashboard
- View total number of tables and rows
- See average rows per table
- Visualize top 10 tables by row count
- Interactive bar charts for data insights

### Settings Page (NEW!)
- **Configure Gemini API Key**: Enter your API key via user-friendly UI
- **Test API Key**: Validate your key works correctly
- **View Current Key**: See masked version of configured key
- **Instructions**: Step-by-step guide to get your API key
- **Pricing Info**: Understand costs and free tier limits

See [SETTINGS_GUIDE.md](./SETTINGS_GUIDE.md) for detailed instructions.

### AI Features
- **AI Insights**: Automated business intelligence and recommendations
- **Natural Language Queries**: Ask questions in plain English
- **Smart Alerts**: Proactive anomaly detection
- **Query Optimization**: AI-powered query suggestions

See [AI_INTEGRATION_GUIDE.md](./AI_INTEGRATION_GUIDE.md) for more details.

## 🏗️ Project Structure

```
pepsaco-db-viewer/
├── app/                      # Next.js 14 App Router
│   ├── api/                  # API routes
│   │   ├── tables/          # List all tables
│   │   ├── table/[name]/    # Get table data and schema
│   │   └── query/           # Execute custom queries
│   ├── analytics/           # Analytics page
│   ├── data/[table]/        # Data viewer page
│   ├── tables/              # Tables browser page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── Navigation.tsx       # Navigation bar
│   ├── TableBrowser.tsx     # Tables list component
│   └── DataTable.tsx        # Data viewer component
├── lib/                     # Utility functions
│   ├── db.ts               # Database connection
│   └── queries.ts          # Database queries
├── .env.local              # Environment variables
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── package.json            # Dependencies
```

## 🔧 Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQL Server (mssql driver)
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **Runtime**: Node.js

## 🔐 Security Features

- Read-only database access (SELECT queries only)
- SQL injection prevention with parameterized queries
- Query validation to block dangerous operations
- Environment variable protection for credentials
- SSL/TLS encrypted database connections

## 📊 Database Information

- **Host**: pepsaco-db-standard.c1oqimeoszvd.eu-west-2.rds.amazonaws.com
- **Port**: 1433
- **Database**: WideWorldImporters_Base
- **Access**: Read-only
- **Tables**: 49 tables across multiple schemas
- **Total Rows**: ~3.8 billion rows

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables for Production

Ensure all environment variables are set in your production environment:
- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USER`
- `DB_PASSWORD`

## 🐛 Troubleshooting

### Database Connection Issues

If you encounter connection errors:

1. **Check credentials**: Verify `.env.local` has correct database credentials
2. **Network access**: Ensure your network allows connections to AWS RDS
3. **SSL certificate**: The app uses `trustServerCertificate: true` for AWS RDS
4. **Restart server**: Stop and restart the development server

### Common Errors

**"Invalid object name"**: This error occurs when table names don't include schema. The app now handles this automatically by using schema-qualified table names (e.g., `Application.Cities`).

**"Table not found"**: Ensure the table exists in the database and you have read permissions.

**Port already in use**: Change the port in `package.json` or stop the process using port 3002.

## 📝 API Endpoints

### GET `/api/tables`
Returns list of all tables with metadata.

**Response**:
```json
{
  "tables": [
    {
      "name": "Cities",
      "schema": "Application",
      "rowCount": 37940
    }
  ]
}
```

### GET `/api/table/[schema.name]`
Returns table schema and data.

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Rows per page (default: 50)
- `sortBy`: Column to sort by
- `sortOrder`: ASC or DESC
- `filter_[column]`: Filter by column value

**Response**:
```json
{
  "schema": [...],
  "data": [...],
  "totalRows": 37940,
  "page": 1,
  "limit": 50
}
```

## 🤝 Contributing

This is a hackathon project for PepsaCo. For questions or issues, contact the development team.

## 📄 License

This project is created for the PepsaCo Hackathon and is proprietary.

## 👥 Team

- **Team**: Team 3
- **Hackathon**: PepsaCo Database Challenge
- **Date**: 2025

## 🎉 Acknowledgments

- PepsaCo for providing the database access
- Finster.ai for hosting the hackathon
- WideWorldImporters sample database

---

**Note**: This application provides read-only access to the database. No data modifications are possible through this interface.
