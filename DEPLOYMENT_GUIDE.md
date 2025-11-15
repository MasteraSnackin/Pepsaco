# Deployment Guide - PepsaCo Database Viewer

## 🚀 Deployment Options

This application can be deployed to various platforms. Below are detailed instructions for each option.

---

## Option 1: Vercel (Recommended - Easiest)

### Prerequisites
- GitHub account
- Vercel account (free tier available)

### Steps

1. **Push to GitHub**
   ```bash
   cd pepsaco-db-viewer
   git init
   git add .
   git commit -m "Initial commit with hybrid database system"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/pepsaco-db-viewer.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables:
     ```
     DB_HOST=pepsaco-db-standard.c1oqimeoszvd.eu-west-2.rds.amazonaws.com
     DB_PORT=1433
     DB_NAME=WideWorldImporters_Base
     DB_USER=hackathon_ro_03
     DB_PASSWORD=Z9@fLm2*
     SQLITE_ENABLED=false
     CACHE_ENABLED=true
     CACHE_TTL_DEFAULT=300
     DB_MODE=remote
     ```
   - Click "Deploy"

3. **Access Your App**
   - Vercel will provide a URL like: `https://pepsaco-db-viewer.vercel.app`

**Note**: SQLite won't work on Vercel (serverless), so use `DB_MODE=remote` with caching.

---

## Option 2: Docker (Full Features)

### Prerequisites
- Docker installed
- Docker Compose installed

### Steps

1. **Create Dockerfile**
   ```dockerfile
   # pepsaco-db-viewer/Dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   # Install dependencies
   COPY package*.json ./
   RUN npm ci --only=production
   
   # Copy application files
   COPY . .
   
   # Build Next.js app
   RUN npm run build
   
   # Expose port
   EXPOSE 3000
   
   # Start application
   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DB_HOST=pepsaco-db-standard.c1oqimeoszvd.eu-west-2.rds.amazonaws.com
         - DB_PORT=1433
         - DB_NAME=WideWorldImporters_Base
         - DB_USER=hackathon_ro_03
         - DB_PASSWORD=Z9@fLm2*
         - SQLITE_DB_PATH=/app/data/local.db
         - SQLITE_ENABLED=true
         - CACHE_ENABLED=true
         - CACHE_TTL_DEFAULT=300
         - DB_MODE=auto
       volumes:
         - ./data:/app/data
       restart: unless-stopped
   ```

3. **Build and Run**
   ```bash
   docker-compose up -d
   ```

4. **Run Migration (Optional)**
   ```bash
   docker-compose exec app npm run migrate
   ```

5. **Access Your App**
   - http://localhost:3000

---

## Option 3: AWS EC2 (Full Control)

### Prerequisites
- AWS account
- EC2 instance (t2.medium or larger recommended)
- Ubuntu 22.04 LTS

### Steps

1. **Connect to EC2**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

4. **Clone and Setup**
   ```bash
   git clone https://github.com/YOUR_USERNAME/pepsaco-db-viewer.git
   cd pepsaco-db-viewer
   npm install
   ```

5. **Configure Environment**
   ```bash
   nano .env.local
   # Add all environment variables
   ```

6. **Build Application**
   ```bash
   npm run build
   ```

7. **Run Migration (Optional)**
   ```bash
   npm run migrate
   ```

8. **Start with PM2**
   ```bash
   pm2 start npm --name "pepsaco-db-viewer" -- start
   pm2 save
   pm2 startup
   ```

9. **Configure Nginx (Optional)**
   ```bash
   sudo apt-get install nginx
   sudo nano /etc/nginx/sites-available/pepsaco
   ```
   
   Add:
   ```nginx
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
   ```
   
   Enable:
   ```bash
   sudo ln -s /etc/nginx/sites-available/pepsaco /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

10. **Access Your App**
    - http://your-ec2-ip or http://your-domain.com

---

## Option 4: Azure App Service

### Prerequisites
- Azure account
- Azure CLI installed

### Steps

1. **Login to Azure**
   ```bash
   az login
   ```

2. **Create Resource Group**
   ```bash
   az group create --name pepsaco-rg --location eastus
   ```

3. **Create App Service Plan**
   ```bash
   az appservice plan create \
     --name pepsaco-plan \
     --resource-group pepsaco-rg \
     --sku B1 \
     --is-linux
   ```

4. **Create Web App**
   ```bash
   az webapp create \
     --resource-group pepsaco-rg \
     --plan pepsaco-plan \
     --name pepsaco-db-viewer \
     --runtime "NODE|18-lts"
   ```

5. **Configure Environment Variables**
   ```bash
   az webapp config appsettings set \
     --resource-group pepsaco-rg \
     --name pepsaco-db-viewer \
     --settings \
       DB_HOST=pepsaco-db-standard.c1oqimeoszvd.eu-west-2.rds.amazonaws.com \
       DB_PORT=1433 \
       DB_NAME=WideWorldImporters_Base \
       DB_USER=hackathon_ro_03 \
       DB_PASSWORD=Z9@fLm2* \
       CACHE_ENABLED=true \
       DB_MODE=remote
   ```

6. **Deploy**
   ```bash
   az webapp deployment source config-zip \
     --resource-group pepsaco-rg \
     --name pepsaco-db-viewer \
     --src pepsaco-db-viewer.zip
   ```

7. **Access Your App**
   - https://pepsaco-db-viewer.azurewebsites.net

---

## Option 5: Local Production Build

### For Local/Internal Network Deployment

1. **Build for Production**
   ```bash
   cd pepsaco-db-viewer
   npm run build
   ```

2. **Run Migration (Optional)**
   ```bash
   npm run migrate
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

4. **Access Your App**
   - http://localhost:3000

5. **Run as Service (Windows)**
   - Use NSSM (Non-Sucking Service Manager)
   ```bash
   nssm install PepsacoDBViewer "C:\Program Files\nodejs\node.exe"
   nssm set PepsacoDBViewer AppDirectory "C:\path\to\pepsaco-db-viewer"
   nssm set PepsacoDBViewer AppParameters "node_modules\.bin\next start"
   nssm start PepsacoDBViewer
   ```

---

## 🔒 Security Considerations

### Production Checklist

- [ ] Change default database credentials
- [ ] Use environment variables (never commit `.env.local`)
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Implement rate limiting
- [ ] Enable CORS properly
- [ ] Use strong passwords
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Backup database regularly

### Environment Variables Security

**Never commit these files:**
- `.env.local`
- `.env.production`
- `data/local.db`

Add to `.gitignore`:
```
.env*.local
.env.production
data/
```

---

## 📊 Performance Optimization

### For Production

1. **Enable Caching**
   ```env
   CACHE_ENABLED=true
   CACHE_TTL_DEFAULT=600
   CACHE_MAX_SIZE=200
   ```

2. **Use SQLite for Better Performance**
   - Run migration on server
   - Set `DB_MODE=auto`
   - Schedule weekly syncs

3. **Optimize Next.js**
   ```javascript
   // next.config.js
   module.exports = {
     compress: true,
     poweredByHeader: false,
     generateEtags: true,
   }
   ```

4. **Use CDN**
   - Deploy static assets to CDN
   - Enable image optimization

---

## 🔄 Maintenance

### Regular Tasks

**Daily:**
- Monitor application logs
- Check error rates
- Verify database connectivity

**Weekly:**
- Run SQLite migration (if using)
- Review cache hit rates
- Check disk space

**Monthly:**
- Update dependencies
- Review security patches
- Backup configuration

### Update Deployment

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run migration (if needed)
npm run migrate

# Rebuild
npm run build

# Restart
pm2 restart pepsaco-db-viewer
# or
docker-compose restart
```

---

## 📈 Monitoring

### Health Check Endpoint

```bash
curl http://your-domain.com/api/system
```

### Key Metrics to Monitor

- Response time
- Cache hit rate
- Database connection status
- Memory usage
- CPU usage
- Disk space (for SQLite)

### Recommended Tools

- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Application Monitoring**: New Relic, Datadog
- **Log Management**: Loggly, Papertrail
- **Error Tracking**: Sentry

---

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Failed**
- Check credentials in environment variables
- Verify network connectivity
- Check firewall rules
- Verify SQL Server is accessible

**2. SQLite Not Working**
- Ensure `data/` directory exists
- Check file permissions
- Verify disk space
- Run migration script

**3. Cache Not Working**
- Check `CACHE_ENABLED=true`
- Verify memory limits
- Restart application

**4. Slow Performance**
- Enable caching
- Run SQLite migration
- Check database indexes
- Monitor network latency

---

## 📞 Support

For deployment issues:
1. Check logs: `pm2 logs` or `docker-compose logs`
2. Verify environment variables
3. Test database connectivity
4. Review this guide
5. Check application status: `/api/system`

---

## ✅ Deployment Checklist

- [ ] Choose deployment platform
- [ ] Set up environment variables
- [ ] Configure database access
- [ ] Build application
- [ ] Run migration (optional)
- [ ] Test deployment
- [ ] Configure domain/SSL
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Document deployment
- [ ] Test all features
- [ ] Enable caching
- [ ] Set up logging
- [ ] Configure alerts

---

**Last Updated**: 2025-11-15  
**Version**: 2.0.0  
**Status**: Production Ready ✅