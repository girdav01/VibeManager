# Deployment Guide

## Prerequisites

Before deploying VibeManager, ensure you have:

1. **Node.js** 18+ installed
2. **PostgreSQL** database (local or hosted)
3. **GitHub OAuth App** credentials
4. **OpenAI API** key
5. **Vercel account** (recommended for hosting)

## Environment Setup

### 1. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb vibemanager
```

#### Option B: Hosted Database (Recommended)
- **Neon**: https://neon.tech (Free tier available)
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app

Get your connection string in format:
```
postgresql://user:password@host:5432/dbname
```

### 2. GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: `VibeManager`
   - Homepage URL: `http://localhost:3000` (or your domain)
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Save Client ID and Client Secret

### 3. OpenAI API Key

1. Visit https://platform.openai.com/api-keys
2. Create new secret key
3. Copy and save it securely

### 4. Environment Variables

Create `.env` file in project root:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vibemanager"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-command-below"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# OpenAI
OPENAI_API_KEY="sk-your-openai-api-key"

# Encryption (for storing GitHub tokens)
ENCRYPTION_KEY="generate-with-command-below"
```

Generate secrets:
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY
openssl rand -hex 32
```

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed database
npx prisma db seed
```

### 3. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### 4. Database Management

```bash
# Open Prisma Studio (visual database editor)
npm run db:studio

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy
```

## Production Deployment (Vercel)

### 1. Prepare for Deployment

```bash
# Test build locally
npm run build
npm start
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### Option B: GitHub Integration
1. Push code to GitHub
2. Connect repository at https://vercel.com/new
3. Vercel auto-detects Next.js
4. Add environment variables in Vercel dashboard
5. Deploy

### 3. Configure Environment Variables in Vercel

Go to Project Settings → Environment Variables and add:

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
OPENAI_API_KEY=...
ENCRYPTION_KEY=...
```

### 4. Update GitHub OAuth Callback

Update your GitHub OAuth App:
- Homepage URL: `https://your-domain.vercel.app`
- Callback URL: `https://your-domain.vercel.app/api/auth/callback/github`

### 5. Run Database Migrations

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy
```

## Alternative Hosting Options

### Railway

1. Visit https://railway.app
2. Create new project from GitHub repo
3. Add PostgreSQL service
4. Configure environment variables
5. Deploy

### DigitalOcean App Platform

1. Create new app from GitHub
2. Configure build command: `npm run build`
3. Configure run command: `npm start`
4. Add managed PostgreSQL database
5. Set environment variables

### Self-Hosted (Docker)

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t vibemanager .
docker run -p 3000:3000 --env-file .env vibemanager
```

## Post-Deployment Checklist

- [ ] Test GitHub OAuth login
- [ ] Create a test project
- [ ] Connect a test repository
- [ ] Verify repo ingestion works
- [ ] Test AI mindmap generation
- [ ] Test PRD creation
- [ ] Test export functionality
- [ ] Set up monitoring (Vercel Analytics, Sentry)
- [ ] Configure custom domain (optional)
- [ ] Set up backups for database

## Monitoring and Maintenance

### Logs

**Vercel:**
```bash
vercel logs [deployment-url]
```

**Database:**
- Use Prisma Studio: `npm run db:studio`
- Check database provider's dashboard

### Error Tracking

Install Sentry:
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### Performance Monitoring

- Enable Vercel Analytics in dashboard
- Monitor OpenAI API usage at https://platform.openai.com/usage

## Scaling Considerations

### Database
- Enable connection pooling (PgBouncer)
- Consider read replicas for heavy read workloads

### Serverless Functions
- Vercel: Upgrade to Pro for more function execution time
- Consider background jobs for long-running tasks (repo ingestion)

### Caching
- Implement Redis for caching analysis results
- Use Vercel Edge Caching for static content

## Troubleshooting

### Build Failures

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules
npm install

# Rebuild
npm run build
```

### Database Connection Issues

- Check DATABASE_URL format
- Verify database is accessible from deployment
- Check firewall/network settings
- Enable SSL if required: `?sslmode=require`

### GitHub OAuth Issues

- Verify callback URL matches exactly
- Check client ID and secret
- Ensure GitHub App is not suspended

## Support

For issues and questions:
- GitHub Issues: [Your repo URL]
- Documentation: [Your docs URL]
- Email: support@yourdomain.com
