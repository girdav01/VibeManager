# VibeManager - AI-Powered SaaS Planning Tool

A CodeSpring-like web application for non-technical founders to plan full-stack SaaS applications, generate detailed PRDs from natural language ideas, and keep PRDs in sync with AI coding environments.

## Features

- 🧠 **AI-Powered Mindmapping**: Transform natural language ideas into structured feature breakdowns
- 📦 **Repo Ingestion**: Connect GitHub repos and auto-analyze codebase structure
- 📝 **PRD Builder**: Generate implementation-ready PRDs with AI assistance
- 🔄 **Drift Detection**: Keep specs and code aligned with automatic sync
- 🎯 **Export to AI Tools**: Optimized exports for Cursor, Claude, and other AI coding assistants
- 📊 **Knowledge Base**: Visual representation of your codebase architecture

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: tRPC, Prisma, PostgreSQL
- **Auth**: NextAuth.js v5 with GitHub OAuth
- **AI**: OpenAI GPT-4
- **Code Analysis**: Tree-sitter
- **UI Components**: shadcn/ui, React Flow

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- GitHub OAuth App (for authentication)
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/VibeManager.git
cd VibeManager
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
VibeManager/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── mindmap/        # Mindmap editor components
│   │   └── prd/            # PRD builder components
│   ├── server/             # Backend logic
│   │   ├── api/            # tRPC routers
│   │   ├── services/       # Business logic services
│   │   └── db.ts           # Prisma client
│   ├── lib/                # Utility functions
│   └── types/              # TypeScript type definitions
├── prisma/
│   └── schema.prisma       # Database schema
└── public/                 # Static assets
```

## Key Workflows

### 1. Project Setup
1. Create account and log in
2. Connect GitHub repository
3. Wait for initial repo ingestion and analysis

### 2. Feature Planning
1. Describe your feature idea in natural language
2. AI generates mindmap with domains and components
3. Edit and refine the mindmap structure

### 3. PRD Creation
1. Select a feature from mindmap
2. Fill in PRD template with AI assistance
3. Review routes, models, and file paths
4. Export to AI coding tool

### 4. Keep in Sync
1. After coding changes, trigger drift detection
2. Review differences between PRD and code
3. Update PRDs or create follow-up tasks

## Development

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Environment Variables

See `.env.example` for all required environment variables.

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

## License

MIT License - see LICENSE file for details

## Support

For questions and support, please open an issue on GitHub.
