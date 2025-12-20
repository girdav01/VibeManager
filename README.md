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
- **AI**: Ollama (gpt-oss:20b) - *migrated from OpenAI GPT-4*
- **Code Analysis**: Tree-sitter
- **UI Components**: shadcn/ui, React Flow

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- GitHub OAuth App (for authentication)
- **Ollama** with gpt-oss:20b model (see [Ollama Setup](#ollama-setup))

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

## Ollama Setup

VibeManager now uses **Ollama** for AI functionality instead of OpenAI. This provides cost-effective, private, and offline-capable AI processing.

### Quick Setup

Run the automated setup script:

```bash
./setup-ollama.sh
```

This script will:
1. Install Ollama (if not already installed)
2. Start the Ollama service
3. Pull the gpt-oss:20b model (~11GB download)
4. Test the integration

### Manual Setup

If you prefer manual installation:

1. **Install Ollama**:
   ```bash
   # Linux
   curl -fsSL https://ollama.com/install.sh | sh
   
   # macOS
   brew install ollama
   ```

2. **Start Ollama service**:
   ```bash
   ollama serve &
   ```

3. **Pull the model**:
   ```bash
   ollama pull gpt-oss:20b
   ```

4. **Test the integration**:
   ```bash
   node test-ollama.js
   ```

### Configuration

The `.env` file includes Ollama configuration:

```env
OLLAMA_BASE_URL="http://localhost:11434/v1"
OLLAMA_MODEL="gpt-oss:20b"
OLLAMA_API_KEY="ollama"
```

### Using a Different Model

To use a different Ollama model:

1. Pull the model: `ollama pull <model-name>`
2. Update `OLLAMA_MODEL` in `.env`

Popular alternatives:
- `llama2:13b` - Smaller, faster
- `llama2:70b` - Larger, higher quality
- `mistral:7b` - Efficient, good quality

### Troubleshooting

If you encounter issues, see the detailed [OLLAMA_MIGRATION.md](./OLLAMA_MIGRATION.md) guide.

Common issues:
- **Ollama not accessible**: Ensure Ollama is running (`ollama serve &`)
- **Model not found**: Pull the model (`ollama pull gpt-oss:20b`)
- **Slow responses**: Consider using a smaller model or enabling GPU acceleration

---

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
