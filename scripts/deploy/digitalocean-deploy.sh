#!/bin/bash

# Modulyn ERP Community Edition - DigitalOcean App Platform Deployment Script
# This script provides instructions and configuration for DigitalOcean App Platform deployment

set -e

echo "🚀 Modulyn ERP Community Edition - DigitalOcean App Platform Deployment"
echo "===================================================================="

echo "📋 DigitalOcean App Platform Deployment Instructions:"
echo ""
echo "1. 🌐 Go to https://cloud.digitalocean.com and sign up/login"
echo "2. 📦 Navigate to Apps > Create App"
echo "3. 🔗 Connect your GitHub repository"
echo "4. ⚙️ Configure the following settings:"
echo ""
echo "   🏗️ Build Configuration:"
echo "   - Source Directory: apps/backend"
echo "   - Build Command: pip install -r requirements.txt"
echo "   - Run Command: python manage.py migrate && python manage.py collectstatic --noinput && python manage.py setup_single_organization --create-admin && gunicorn backend.wsgi:application"
echo ""
echo "   🌍 Environment Variables:"
echo "   - DJANGO_ENV=production"
echo "   - DEBUG=False"
echo "   - SECRET_KEY=your-secret-key-here"
echo "   - DATABASE_URL=postgresql://user:pass@host:port/db (use DigitalOcean Database)"
echo "   - ALLOWED_HOSTS=your-app.ondigitalocean.app"
echo "   - CORS_ALLOWED_ORIGINS=https://your-frontend-url.com"
echo ""
echo "5. 🗄️ Add PostgreSQL Database:"
echo "   - Go to Databases > Create Database"
echo "   - Choose PostgreSQL"
echo "   - Copy the connection string to DATABASE_URL"
echo ""
echo "6. 🔄 Deploy and test your application"
echo ""
echo "📚 For detailed instructions, see:"
echo "https://docs.digitalocean.com/products/app-platform/"
echo ""
echo "🔗 Useful Links:"
echo "- DigitalOcean Dashboard: https://cloud.digitalocean.com"
echo "- App Platform Documentation: https://docs.digitalocean.com/products/app-platform/"
echo ""
