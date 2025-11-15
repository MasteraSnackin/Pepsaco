# 🚀 Deployment Instructions

Complete guide to deploying PepsaCo Database Viewer to production.

---

## 📋 Table of Contents

1. [Current Status](#current-status)
2. [Local Development](#local-development)
3. [Production Build](#production-build)
4. [Vercel Deployment](#vercel-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Manual Server Deployment](#manual-server-deployment)
7. [Environment Variables](#environment-variables)
8. [Post-Deployment](#post-deployment)

---

## ✅ Current Status

Your project is currently running in **development mode** at:
- **URL**: http://localhost:3000
- **Status**: ✅ Running
- **Mode**: Development

All recent changes are live:
- ✅ Settings page for API key management
- ✅ Gemini AI integration
- ✅ Updated navigation with Settings link
- ✅ Comprehensive documentation
- ✅ Professional README

---

## 💻 Local Development

### Current Setup

Your development server is already running. To restart it:

```bash
# Stop current server (Ctrl+C in terminal)
# Then restart:
cd pepsaco-db-viewer
npm run dev
```

### Access Points

- **Home**: http://localhost:3000
- **Tables**: http://localhost:3000/tables
- **Analytics**: http://localhost:3000/analytics
- **Settings**: http://localhost:3000/settings
- **AI Insights**: http://localhost:3000/insights

---

## 🏗️ Production Build

### Step 1: Create Production Build

```bash
cd pepsaco-db-viewer

# Install dependencies (if not already done)
npm install

# Create optimized production build
npm run build

# This will:
# - Compile TypeScript
# - Optimize JavaScript bundles
# - Generate static pages
# - Create .next/standalone folder
```

### Step 2: Test Production Build Locally

```bash
# Start production server
npm start

# Access at http://localhost:3000
```

### Step 3: Verify Build

Check that all features work:
- [ ] Home page loads
- [ ] Tables browser works
- [ ] Data viewer displays data
- [ ] Analytics dashboard shows charts
- [ ] Settings page accessible
- [ ] AI features work (if API key configured)

---

## ☁️ Vercel Deployment (Recommended)

### Why Vercel?

- ✅ Built for Next.js
- ✅ Automatic deployments
- ✅ Free tier available
- ✅ Global CDN
- ✅ Easy environment variable management

### Option 1: Deploy via Vercel Dashboard

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub/GitLab/Bitbucket

2. **Import Project**
   - Click "New Project"
   - Import your Git repository
   - Or upload the `pepsaco-db-viewer` folder

3. **Configure Project**
   - Framework Preset: **Next.js**
   - Root Directory: `./` (or `pepsaco-db-viewer` if in subdirectory)
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Add Environment Variables**
   
   In Vercel Dashboard → Settings → Environment Variables, add:
   
   ```
   DB_HOST=pepsaco-db-standard.c1oqimeoszvd.eu-west-2.rds.amazonaws.com
   DB_PORT=1433
   DB_DATABASE=WideWorldImporters_Base
   DB_USER=hackathon_ro_03
   DB_PASSWORD=Z9@fLm2*
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd pepsaco-db-viewer
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? pepsaco-db-viewer
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add DB_HOST
vercel env add DB_PORT
vercel env add DB_DATABASE
vercel env add DB_USER
vercel env add DB_PASSWORD
vercel env add GEMINI_API_KEY

# Deploy to production
vercel --prod
```

### Option 3: One-Click Deploy

Click this button to deploy directly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/pepsaco-db-viewer)

---

## 🐳 Docker Deployment

### Step 1: Create Dockerfile

Create `Dockerfile` in `pepsaco-db-viewer/`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Step 2: Create .dockerignore

Create `.dockerignore`:

```
node_modules
.next
.git
.env.local
npm-debug.log
README.md
.DS_Store
```

### Step 3: Build and Run

```bash
# Build Docker image
cd pepsaco-db-viewer
docker build -t pepsaco-db-viewer .

# Run container
docker run -p 3000:3000 \
  -e DB_HOST=pepsaco-db-standard.c1oqimeoszvd.eu-west-2.rds.amazonaws.com \
  -e DB_PORT=1433 \
  -e DB_DATABASE=WideWorldImporters_Base \
  -e DB_USER=hackathon_ro_03 \
  -e DB_PASSWORD=Z9@fLm2* \
  -e GEMINI_API_KEY=your-key-here \
  pepsaco-db-viewer

# Access at http://localhost:3000
```

### Step 4: Docker Compose (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT}
      - DB_DATABASE=${DB_DATABASE}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

---

## 🖥️ Manual Server Deployment

### Prerequisites

- Ubuntu 20.04+ or similar Linux server
- Node.js 18+ installed
- PM2 for process management
- Nginx for reverse proxy (optional)

### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx (optional)
sudo apt install -y nginx
```

### Step 2: Upload Project

```bash
# On your local machine, create a tarball
cd pepsaco-db-viewer
npm run build
tar -czf pepsaco-db-viewer.tar.gz .

# Upload to server
scp pepsaco-db-viewer.tar.gz user@your-server:/home/user/

# On server, extract
ssh user@your-server
cd /home/user
tar -xzf pepsaco-db-viewer.tar.gz -C pepsaco-db-viewer
cd pepsaco-db-viewer
```

### Step 3: Configure Environment

```bash
# Create .env.local
cat > .env.local << EOF
DB_HOST=pepsaco-db-standard.c1oqimeoszvd.eu-west-2.rds.amazonaws.com
DB_PORT=1433
DB_DATABASE=WideWorldImporters_Base
DB_USER=hackathon_ro_03
DB_PASSWORD=Z9@fLm2*
GEMINI_API_KEY=your-key-here
EOF
```

### Step 4: Start with PM2

```bash
# Install dependencies
npm install --production

# Start with PM2
pm2 start npm --name "pepsaco-db-viewer" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs

# Check status
pm2 status
pm2 logs pepsaco-db-viewer
```

### Step 5: Configure Nginx (Optional)

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/pepsaco-db-viewer

# Add this configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/pepsaco-db-viewer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Setup SSL (Optional)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

---

## 🔐 Environment Variables

### Required Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `DB_HOST` | `pepsaco-db-standard.c1oqimeoszvd.eu-west-2.rds.amazonaws.com` | Database host |
| `DB_PORT` | `1433` | Database port |
| `DB_DATABASE` | `WideWorldImporters_Base` | Database name |
| `DB_USER` | `hackathon_ro_03` | Database username |
| `DB_PASSWORD` | `Z9@fLm2*` | Database password |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | None |
| `NEXT_PUBLIC_APP_URL` | Public URL of your app | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | `production` |

### Security Notes

- ⚠️ Never commit `.env.local` to version control
- ✅ Use environment variable management in your hosting platform
- ✅ Rotate API keys regularly
- ✅ Use different keys for development and production

---

## ✅ Post-Deployment

### 1. Verify Deployment

Check these URLs work:
- [ ] Home page: `https://your-domain.com`
- [ ] Tables: `https://your-domain.com/tables`
- [ ] Analytics: `https://your-domain.com/analytics`
- [ ] Settings: `https://your-domain.com/settings`
- [ ] API: `https://your-domain.com/api/tables`

### 2. Test Features

- [ ] Database connection works
- [ ] Tables load correctly
- [ ] Data viewer displays data
- [ ] Charts render properly
- [ ] Settings page accessible
- [ ] AI features work (if configured)

### 3. Configure Gemini API Key

If you haven't added the Gemini API key yet:

1. Visit `https://your-domain.com/settings`
2. Enter your Gemini API key
3. Click "Save API Key"
4. Click "Test API Key" to verify
5. Restart the application

### 4. Monitor Performance

- Check response times
- Monitor error logs
- Set up uptime monitoring (e.g., UptimeRobot)
- Configure alerts for errors

### 5. Setup Analytics (Optional)

- Add Google Analytics
- Configure Vercel Analytics
- Setup error tracking (e.g., Sentry)

---

## 🔧 Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues

- Verify environment variables are set correctly
- Check database firewall allows your server IP
- Test connection with `npm run test:connection`

### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

### Environment Variables Not Loading

- Ensure `.env.local` exists in project root
- Restart the application after changes
- Check variable names match exactly

---

## 📞 Support

For deployment issues:

1. Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. Review [Troubleshooting](#troubleshooting) section
3. Check application logs
4. Contact: team3@hackathon.pepsaco.com

---

## 🎉 Success!

Your PepsaCo Database Viewer is now deployed and ready to use!

**Next Steps:**
1. Share the URL with your team
2. Configure Gemini API key for AI features
3. Monitor performance and usage
4. Gather feedback and iterate

---

**Deployed by Team 3 | PepsaCo Hackathon 2025**