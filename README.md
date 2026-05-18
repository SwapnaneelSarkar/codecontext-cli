# CodeContext

A full-stack monorepo for a CLI + web dashboard tool that scans local codebases, parses them, and generates AI-friendly structured context. This helps AI coding agents (like Claude Code, Cursor) understand projects faster with fewer tokens.

See **[BRIEF.md](BRIEF.md)** for architecture, CLI workflow, output format, and maturity notes.

## Features

- **CLI Tool**: Fast codebase scanning with intelligent file filtering
- **Web Dashboard**: Beautiful Next.js interface for browsing generated context
- **Type-Safe**: 100% TypeScript across all packages
- **Modular**: Shared types and utilities in `@codecontext/core`
- **Extensible**: Stub functions ready for Tree-sitter, LLM integration, and more

## Project Structure

```
codecontext/
├── packages/
│   ├── cli/              # Node.js CLI tool (npx codecontext)
│   │   ├── src/
│   │   │   ├── commands/ # init, generate, update, query, stats, dashboard, prompt
│   │   │   ├── parser/   # File scan, regex + optional Tree-sitter
│   │   │   ├── graph/    # Dependency graph
│   │   │   ├── writer/   # Context output writer
│   │   │   └── summarizer/ # LLM summarization (Ollama default, Anthropic / OpenAI)
│   │   └── package.json
│   ├── core/             # Shared types and utilities
│   │   └── src/
│   │       ├── types/    # TypeScript interfaces
│   │       └── utils/    # Helper functions
│   └── dashboard/        # Next.js web application
│       └── src/
│           ├── app/      # Pages (home, graph, files, query) + API routes
│           ├── components/ # UI components
│           └── lib/      # Utilities
├── turbo.json           # Turborepo configuration
├── tsconfig.base.json   # Base TypeScript config
└── package.json         # Root workspace config
```

## Tech Stack

- **Monorepo**: Turborepo + npm workspaces (`pnpm` also supported)
- **Language**: TypeScript throughout
- **CLI**: Commander.js, Chalk, Ora spinners
- **Dashboard**: Next.js 14, React 18, Tailwind CSS, React Flow
- **Types**: Full type safety with shared core package

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm 8+

### Installation

```bash
npm install
npm run build
```

Use `pnpm install` / `pnpm build` if you prefer pnpm; set `@codecontext/core` in `packages/cli` and `packages/dashboard` to `workspace:*` when using pnpm workspaces.

## Free LLM Setup (Ollama)

`codecontext` uses **Ollama** by default — no API key needed.

1. Install: `brew install ollama`
2. Start: `brew services start ollama`
3. Pull model: `ollama pull codellama`
4. Run: `codecontext generate /path/to/project`

If Ollama is not running, the CLI prints a short hint and continues with regex-only summaries (same as `--skip-llm`). To use Anthropic or OpenAI instead, set `llm.provider` in `.codecontextrc.json` and use `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`.

### CLI Usage

```bash
# From repo after build:
node packages/cli/dist/index.js init
node packages/cli/dist/index.js generate --dir ./my-project
node packages/cli/dist/index.js generate --skip-llm --dir ./my-project   # AST only, no LLM
node packages/cli/dist/index.js query "authentication"
node packages/cli/dist/index.js stats --dir ./my-project
node packages/cli/dist/index.js update --dir ./my-project
node packages/cli/dist/index.js prompt   # print agent instructions block

# Dashboard (from monorepo; sets CODECONTEXT_PROJECT_ROOT)
node packages/cli/dist/index.js dashboard --dir ./my-project
```

Default summaries use **local Ollama** (see above). For cloud APIs, set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` and configure `llm.provider` in `.codecontextrc.json`. See [SPEC.md](SPEC.md) for `.ai-context/` layout.

### Dashboard

After `codecontext dashboard --dir <project>`, open `http://localhost:3000`. The app reads `.ai-context/index.json` via `/api/context` when `CODECONTEXT_PROJECT_ROOT` is set.

- **Overview**: Project statistics and summary
- **Dependency Graph**: Interactive graph (imports / db / api hints)
- **File Browser**: Search files
- **Query**: BM25 search over summaries

## Generated Output

The CLI generates the following structure in `.ai-context/`:

```
.ai-context/
├── index.json       # Complete project index with all metadata
├── graph.json       # Dependency graph
├── files/           # One JSON per source file
└── modules/         # Module-level summaries
```

## Core Types

All types are defined in `@codecontext/core/src/types/index.ts`:

```typescript
interface FileContext {
  filePath: string;
  language: string;
  purpose: string;
  exports: string[];
  imports: string[];
  functions: string[];
  dependencies: string[];
  dbAccess: string[];
  apiUsage: string[];
  summary: string;
}

interface ProjectGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface ProjectIndex {
  projectName: string;
  generatedAt: string;
  totalFiles: number;
  languages: string[];
  modules: string[];
  files: FileContext[];
  graph: ProjectGraph;
}
```

## Development

### Package Commands

Each package supports standard commands:

```bash
# Within a specific package
cd packages/cli
pnpm dev    # Watch mode
pnpm build  # Build for production
pnpm lint   # Linting (placeholder)

# Or use Turborepo from root
pnpm dev    # All packages in parallel
pnpm build  # Build dependency chain
```

### Adding Dependencies

```bash
# Add to a specific package
pnpm add -D typescript --filter @codecontext/cli

# Add to root workspace
pnpm add -D turbo -w
```

## TODO & Stubs

Heavy lifting features are stubbed with TODO comments:

- **Tree-sitter Integration**: `packages/cli/src/parser/astParser.ts`
  - Extract functions, exports, imports from AST
  - Parse multiple languages (TS, JS, Python, etc.)

- **LLM Summarization**: `packages/cli/src/summarizer/llmSummarizer.ts`
  - Integrate with Claude, GPT-4, or local models
  - Cache summaries for performance

- **Dependency Graph**: `packages/cli/src/graph/graphBuilder.ts`
  - Analyze imports and create edges
  - Identify circular dependencies

- **Dashboard Data Loading**: `packages/dashboard/src/lib/readContext.ts`
  - Load `.ai-context/index.json` from projects
  - Implement file watching and caching

## Scripts

Root workspace scripts use Turborepo:

```bash
pnpm dev     # Start all dev servers
pnpm build   # Build all packages
pnpm lint    # Run linters (all)
pnpm test    # Run tests (all)
```

## File Ignore Patterns

Files matching these patterns are ignored during scanning:

- `node_modules/`
- `.git/`
- `.next/`
- `dist/`
- `build/`
- `.ai-context/`
- `.env*`

## Contributing

This is a skeleton/template project with stubs for integration work:

1. Start with the CLI commands and test file scanning
2. Implement Tree-sitter parsing for accurate AST extraction
3. Add LLM summarization for file context
4. Connect dashboard to real project data
5. Build interactive graph visualization with React Flow

## License

MIT
