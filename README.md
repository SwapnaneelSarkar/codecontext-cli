# CodeContext

A full-stack monorepo for a CLI + web dashboard tool that scans local codebases, parses them, and generates AI-friendly structured context. This helps AI coding agents (like Claude Code, Cursor) understand projects faster with fewer tokens.

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
│   │   │   ├── commands/ # generate, query, init commands
│   │   │   ├── parser/   # File scanning and AST parsing (stubbed)
│   │   │   ├── graph/    # Dependency graph building (stubbed)
│   │   │   ├── writer/   # Context output writer
│   │   │   └── summarizer/ # LLM summarization (stubbed)
│   │   └── package.json
│   ├── core/             # Shared types and utilities
│   │   └── src/
│   │       ├── types/    # TypeScript interfaces
│   │       └── utils/    # Helper functions
│   └── dashboard/        # Next.js web application
│       └── src/
│           ├── app/      # Pages (home, graph, files)
│           ├── components/ # UI components
│           └── lib/      # Utilities
├── turbo.json           # Turborepo configuration
├── tsconfig.base.json   # Base TypeScript config
└── package.json         # Root workspace config
```

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Language**: TypeScript throughout
- **CLI**: Commander.js, Chalk, Ora spinners
- **Dashboard**: Next.js 14, React 19, Tailwind CSS
- **Types**: Full type safety with shared core package

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm 8+

### Installation

```bash
# Install dependencies for all packages
pnpm install

# Build all packages
pnpm build

# Start development servers
pnpm dev
```

### CLI Usage

```bash
# Initialize context folder in a project
npx @codecontext/cli init

# Generate context by scanning a directory
npx @codecontext/cli generate --dir ./my-project

# Query context (coming soon)
npx @codecontext/cli query "What does the auth module do?"
```

### Dashboard

The dashboard starts at `http://localhost:3000` and provides:

- **Overview**: Project statistics and summary
- **Dependency Graph**: Visual representation of module relationships
- **File Browser**: Search and explore individual files with context

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
