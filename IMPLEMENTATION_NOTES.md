# Implementation Notes

## Project Status

This is a **v1 MVP implementation** of VibeManager, a CodeSpring-like SaaS planning tool. The core architecture and key features have been implemented as a foundation for further development.

## What's Implemented ✅

### 1. Core Infrastructure
- ✅ Next.js 15 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS styling
- ✅ Prisma ORM with PostgreSQL
- ✅ tRPC for type-safe APIs
- ✅ NextAuth.js v5 for authentication

### 2. Database Schema
- ✅ User management with roles
- ✅ Projects and repositories
- ✅ Features with mindmap data
- ✅ PRDs (Product Requirement Documents)
- ✅ Tasks with Kanban status
- ✅ Drift detection tracking
- ✅ OAuth account linking

### 3. Backend Services
- ✅ **AI Service**: OpenAI GPT-4 integration for:
  - Mindmap generation from natural language
  - PRD content generation
  - Export prompt optimization
- ✅ **Repo Ingestion Service**: Clones and analyzes GitHub repos
- ✅ **Framework Detector**: Supports Next.js, Django, Rails, Laravel, and more
- ✅ **Code Analyzer**: Extracts routes, models, components from codebases

### 4. API Routers (tRPC)
- ✅ Project CRUD operations
- ✅ Repository connection and ingestion
- ✅ Feature creation from ideas
- ✅ PRD generation and management
- ✅ Knowledge base retrieval

### 5. Authentication
- ✅ GitHub OAuth with repo access
- ✅ Credentials (email/password) provider
- ✅ Session management
- ✅ Protected API routes

### 6. Frontend Pages
- ✅ Landing page
- ✅ Dashboard with project list
- ✅ Basic UI components (Button, Card, Input, Badge)

## What's NOT Implemented (Next Steps) 🚧

### High Priority
1. **Mindmap Editor**
   - React Flow integration for visual mindmap editing
   - Drag-and-drop node manipulation
   - Save/load mindmap state

2. **PRD Builder UI**
   - Form-based PRD creation interface
   - Rich text editing for problem statements
   - Route/model/component builders
   - Version comparison view

3. **Project Detail Page**
   - Repository list and status
   - Feature cards with mindmaps
   - Quick actions (create feature, sync repo)

4. **Feature Detail Page**
   - Mindmap visualization
   - PRD list and versions
   - Task board (Kanban)

5. **Drift Detection**
   - Background job to compare PRDs vs code
   - Diff visualization
   - Sync recommendations

### Medium Priority
6. **User Registration Page**
   - Sign up form with validation
   - Email verification flow

7. **Settings Page**
   - User profile management
   - GitHub token management
   - Project settings

8. **Export Functionality**
   - Download PRD as Markdown
   - Copy optimized prompt for Cursor/Claude
   - GitHub issue creation

9. **Search & Filtering**
   - Search across projects, features, PRDs
   - Filter by status, domain

10. **Notifications**
    - Repo ingestion completion
    - Drift detection alerts
    - Feature status changes

### Low Priority
11. **Team Collaboration**
    - Invite team members
    - Role-based permissions
    - Activity feed

12. **Analytics Dashboard**
    - Feature velocity
    - PRD completion rate
    - AI usage metrics

13. **Template Library**
    - Pre-built PRD templates
    - Boilerplate repo integrations
    - Domain templates (auth, payments, etc.)

## Known Limitations

### 1. Repo Ingestion
- Currently synchronous (blocks request)
- Should be moved to background queue (BullMQ)
- Large repos (>10k files) may timeout
- No incremental sync (full re-analysis each time)

### 2. Code Analysis
- Basic pattern matching (not AST-based)
- Limited framework support
- No support for monorepos
- May miss dynamic routes

### 3. AI Features
- Depends on OpenAI API (cost consideration)
- No fallback for API failures
- Rate limiting not implemented
- No streaming responses

### 4. Security
- GitHub tokens stored encrypted (good)
- But encryption key in env var (should use KMS)
- No rate limiting on API routes
- No CSRF protection on forms
- No input sanitization on PRD exports

### 5. Performance
- No caching of analysis results
- No pagination on lists
- All queries eager-load relations
- No database indexes defined

## Technical Debt

1. **Error Handling**
   - Generic error messages
   - No proper error boundaries
   - Limited validation on inputs

2. **Testing**
   - No unit tests
   - No integration tests
   - No E2E tests

3. **Monitoring**
   - No logging infrastructure
   - No error tracking (Sentry)
   - No performance monitoring

4. **Documentation**
   - No JSDoc comments
   - Limited inline code comments
   - No API documentation

## Recommended Next Steps

### Week 1: Core Features
1. Implement mindmap editor with React Flow
2. Build PRD builder UI with forms
3. Create project and feature detail pages
4. Add background job queue for repo ingestion

### Week 2: User Experience
5. Implement search and filtering
6. Add export functionality (Markdown, optimized prompts)
7. Build settings page
8. Create onboarding flow

### Week 3: Stability
9. Add error handling and validation
10. Implement drift detection
11. Set up monitoring and logging
12. Write critical path tests

### Week 4: Polish
13. Performance optimizations (caching, pagination)
14. Security hardening
15. UI/UX improvements
16. Documentation

## Architecture Decisions

### Why Next.js?
- Full-stack framework (API + UI)
- Great DX with TypeScript
- Easy deployment to Vercel
- Strong ecosystem

### Why tRPC?
- End-to-end type safety
- No manual API contracts
- Excellent DX with autocomplete
- Lightweight compared to GraphQL

### Why Prisma?
- Type-safe ORM
- Great migration system
- Prisma Studio for debugging
- Multi-database support

### Why Not Included?
- **WebSockets**: Deferred for v2 (real-time collaboration)
- **Redis**: Not needed yet (can add for caching later)
- **Docker**: Simple deployment to Vercel first
- **Testing**: Will add after core features stabilize

## File Structure

```
VibeManager/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js pages
│   │   ├── api/              # API routes
│   │   ├── dashboard/        # Dashboard page
│   │   └── page.tsx          # Landing page
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── mindmap/          # Mindmap editor (TODO)
│   │   ├── prd/              # PRD builder (TODO)
│   │   └── knowledge-base/   # Knowledge base viewer (TODO)
│   ├── lib/
│   │   ├── auth.ts           # NextAuth config
│   │   ├── utils.ts          # Utilities
│   │   └── trpc/             # tRPC client setup
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/      # tRPC routers
│   │   │   └── trpc/         # tRPC setup
│   │   ├── services/         # Business logic
│   │   │   ├── ai.ts         # OpenAI integration
│   │   │   ├── repo-ingestion.ts
│   │   │   ├── framework-detector.ts
│   │   │   └── code-analyzer.ts
│   │   └── db.ts             # Prisma client
│   └── types/                # TypeScript types
├── ARCHITECTURE.md            # System design
├── DEPLOYMENT.md              # Deployment guide
└── README.md                  # Getting started
```

## Contributing

When adding new features:

1. **Backend**: Add tRPC router in `src/server/api/routers/`
2. **Frontend**: Create page in `src/app/` or component in `src/components/`
3. **Database**: Update `prisma/schema.prisma` and run migration
4. **Types**: Update TypeScript types in `src/types/`
5. **Tests**: Add tests for critical paths (when testing is set up)

## Questions & Assumptions

### Assumptions Made
- Single-tenant per project (no multi-tenant features)
- Primary use case: solo founders and small teams
- OpenAI GPT-4 is acceptable for AI features
- GitHub is the only VCS in v1
- English-only UI (no i18n)

### Open Questions
1. **Pricing Model**: Free tier limits? Token quotas?
2. **Repo Size Limits**: Max files? Max LOC?
3. **AI Fallbacks**: What if OpenAI is down?
4. **Multi-repo**: Support in v1 or v2?
5. **Export Formats**: Just Markdown + prompts, or also PDF/Notion/Linear?

## Contact & Support

For implementation questions:
- Review `ARCHITECTURE.md` for system design
- Check `DEPLOYMENT.md` for setup help
- Open GitHub issue for bugs
- Contact: [Your email/contact]
