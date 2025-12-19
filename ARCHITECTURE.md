# VibeManager Architecture

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: React 18+
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand + React Query
- **Mindmap Visualization**: React Flow
- **Forms**: React Hook Form + Zod validation

### Backend
- **API**: Next.js API Routes + tRPC
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **File Processing**: Node.js streams
- **Queue System**: BullMQ (for async repo analysis)

### AI & Analysis
- **LLM Provider**: OpenAI GPT-4
- **Code Parsing**: Tree-sitter
- **Framework Detection**: Custom analyzers
- **Git Integration**: simple-git library

### Infrastructure
- **Hosting**: Vercel (frontend + serverless functions)
- **Database**: Neon/Supabase PostgreSQL
- **Storage**: S3-compatible (for cached analysis)
- **Auth Tokens**: Encrypted at rest

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Next.js Frontend                    │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐    │
│  │Dashboard │  │ Mindmap  │  │  PRD Builder   │    │
│  │   UI     │  │  Editor  │  │      UI        │    │
│  └──────────┘  └──────────┘  └────────────────┘    │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              tRPC API Layer (Type-safe)              │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌─────────────┐ ┌────────────────┐
│   Auth       │ │   GitHub    │ │  AI Services   │
│   Service    │ │   Service   │ │  (GPT-4)       │
└──────────────┘ └─────────────┘ └────────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│              Prisma ORM + PostgreSQL                 │
│                                                       │
│  Users │ Projects │ Repos │ Features │ PRDs │ Tasks │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Background Job Queue                    │
│  - Repo ingestion                                    │
│  - Code analysis                                     │
│  - Drift detection                                   │
└─────────────────────────────────────────────────────┘
```

## Core Modules

### 1. Repo Ingestion Engine
- Clone/fetch GitHub repos
- Framework detection (Next.js, Django, Rails, etc.)
- Route extraction
- Model/schema detection
- Dependency analysis

### 2. Knowledge Base Builder
- Parse and structure codebase
- Build domain map
- Extract components, services, utilities
- Track file relationships

### 3. AI Mindmap Generator
- Natural language → structured mindmap
- Domain clustering
- Feature breakdown
- Dependency mapping

### 4. PRD Builder
- Template-based PRD creation
- AI-assisted field completion
- Validation against repo structure
- Version control

### 5. Export Engine
- Cursor/Claude prompt optimization
- Markdown export
- MCP-compatible API
- Context compression

### 6. Drift Detector
- Compare PRDs vs actual code
- Identify implemented/partial/diverged features
- Generate sync recommendations

## Database Schema (Core Entities)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  role          Role      @default(OWNER)
  projects      Project[]
  createdAt     DateTime  @default(now())
}

model Project {
  id            String    @id @default(cuid())
  name          String
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  repos         Repo[]
  features      Feature[]
  createdAt     DateTime  @default(now())
}

model Repo {
  id            String    @id @default(cuid())
  projectId     String
  project       Project   @relation(fields: [projectId], references: [id])
  githubUrl     String
  branch        String    @default("main")
  framework     String?
  lastIngestedAt DateTime?
  knowledgeBase Json?
  accessToken   String    @encrypted
}

model Feature {
  id            String    @id @default(cuid())
  projectId     String
  project       Project   @relation(fields: [projectId], references: [id])
  name          String
  description   String
  mindmapData   Json?
  prds          PRD[]
  status        FeatureStatus
}

model PRD {
  id              String    @id @default(cuid())
  featureId       String
  feature         Feature   @relation(fields: [featureId], references: [id])
  version         Int       @default(1)
  problemStatement String
  userStory       String
  routes          Json[]
  models          Json[]
  filePaths       String[]
  acceptanceCriteria String[]
  status          PRDStatus
  tasks           Task[]
}

model Task {
  id            String    @id @default(cuid())
  prdId         String
  prd           PRD       @relation(fields: [prdId], references: [id])
  title         String
  status        TaskStatus
}
```

## Security Considerations

1. **Token Storage**: GitHub PATs encrypted with AES-256
2. **OAuth Scopes**: Minimal required (repo:read)
3. **Rate Limiting**: API routes protected
4. **Input Validation**: Zod schemas on all inputs
5. **CORS**: Restricted origins
6. **SQL Injection**: Prisma parameterized queries

## Performance Targets

- Repo ingestion: < 2 min for 10k LOC
- Mindmap render: < 100ms for 200 nodes
- PRD generation: < 5s with AI
- Drift detection: < 30s for typical changes
