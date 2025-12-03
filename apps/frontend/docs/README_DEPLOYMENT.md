# 🚀 Modulyn Frontend - Vercel Deployment

This document provides quick instructions for deploying the Modulyn frontend to Vercel.

## Quick Start

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
# For preview deployment
./deploy.sh

# For production deployment
./deploy.sh --prod
```

## Manual Deployment

### Option 1: CLI Deployment
```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

### Option 2: GitHub Integration
1. Push your code to GitHub
2. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your repository
5. Set root directory to `apps/frontend`
6. Deploy!

## Environment Variables

Set these in your Vercel project settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://your-api.vercel.app/api/v1` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key | `pk_live_...` |
| `VITE_PAYPAL_CLIENT_ID` | PayPal client ID | `your_paypal_client_id` |
| `VITE_APP_NAME` | Application name | `Modulyn` |

## Build Configuration

- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node.js Version**: 18.x

## Features Included

✅ **Landing Page**: Professional marketing site  
✅ **Authentication**: Login/logout with JWT  
✅ **Dashboard**: Complete ERP dashboard  
✅ **Modules**: Inventory, Finance, HR, Scheduling, Analytics  
✅ **Payment Integration**: Stripe & PayPal  
✅ **Responsive Design**: Mobile-first approach  
✅ **Error Handling**: Global error boundaries  
✅ **Loading States**: Professional UX  

## Support

- 📚 [Full Deployment Guide](./VERCEL_DEPLOYMENT.md)
- 🔧 [Vercel Documentation](https://vercel.com/docs)
- 🐛 [Report Issues](https://github.com/your-repo/issues)

## License

MIT License - see LICENSE file for details.
