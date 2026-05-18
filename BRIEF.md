# CodeContext — Project Brief

## What it is

**CodeContext** (`codecontext-cli`) is a developer tool that **indexes a local codebase** and writes a standardized **`.ai-context/`** bundle: per-file summaries, import/export metadata, a dependency graph, and agent-oriented markdown fragments. The goal is to help AI coding assistants understand a project **faster and with fewer tokens** than dumping raw source files.

Version: **0.1.0** (MIT). Monorepo managed with **Turborepo** and npm/pnpm workspaces.

## Problem it solves

Large repos are expensive for LLM context windows. CodeContext pre-computes:

- What each file does (purpose, summary, exports, functions)
- How files connect (imports, DB/API hints, circular dependency warnings)
- Searchable indexes (BM25 query over summaries)

Consumers read a small, stable JSON/Markdown surface instead of re-parsing the whole tree on every session.

## Architecture

```mermaid
flowchart LR
  subgraph cli [CLI packages/cli]
    scan[fileScanner]
    parse[astParser + regex]
    deps[dependencyMapper]
    graph[graphBuilder]
    llm[llmSummarizer]
    write[contextWriter]
  end
  subgraph output [.ai-context/]
    index[index.json]
    g[graph.json]
    files[files/*.json]
    md[CONTEXT.md / CLAUDE.md]
  end
  subgraph dash [Dashboard packages/dashboard]
    ui[Next.js UI]
    api["/api/context"]
  end
  scan --> parse --> deps --> graph
  parse --> llm --> write
  graph --> write
  write --> output
  output --> api --> ui
```

| Package | Role |
|---------|------|
| [`packages/cli`](packages/cli) | `codecontext` binary — scan, parse, summarize, write context |
| [`packages/core`](packages/core) | Shared types (`FileContext`, `ProjectIndex`, `ProjectGraph`) |
| [`packages/dashboard`](packages/dashboard) | Next.js 14 UI: overview, graph, file browser, BM25 query |

## CLI workflow

Commands ([`packages/cli/src/index.ts`](packages/cli/src/index.ts)):

| Command | Purpose |
|---------|---------|
| `init` | Bootstrap `.codecontextrc.json` |
| `generate` | Full pipeline: scan → AST/regex parse → deps → graph → LLM summaries → write `.ai-context/` |
| `update` | Incremental refresh (uses `manifest.json` content hashes) |
| `query` | Search generated summaries |
| `stats` | Project/index statistics |
| `dashboard` | Start Next.js dashboard with `CODECONTEXT_PROJECT_ROOT` |
| `prompt` | Print agent instruction block |
| `test-llm` | Verify LLM provider connectivity |

**Generate pipeline** ([`packages/cli/src/pipeline/runGenerate.ts`](packages/cli/src/pipeline/runGenerate.ts)): `scanFiles` → `parseFilesAST` → `mapDependencies` → `buildDependencyGraph` → optional `summarizeFiles` → `writeContext`.

**Parsing**: Regex heuristics plus optional **Tree-sitter** (TypeScript, Python, Go). Ignores `node_modules`, `.git`, `dist`, `.ai-context`, etc.

**Summarization**: Default **Ollama** (local, no API key); falls back to regex-only with `--skip-llm`. Also supports **Anthropic** and **OpenAI** via `.codecontextrc.json` and env keys.

## Output format

Documented in [`SPEC.md`](SPEC.md). Key artifacts under `.ai-context/`:

- `index.json` — master `ProjectIndex` (files + embedded graph)
- `graph.json` — nodes (`file` / `module` / `db` / `api`) and edges (`imports`, `calls`, etc.)
- `manifest.json` — per-file hashes for incremental updates
- `files/<slug>.json` — one `FileContext` per source file
- `CONTEXT.md`, `CLAUDE.md`, `.cursorrules.fragment` — human/agent-readable snippets
- Optional `cache/summaries.json` for LLM cache

## Dashboard

After `codecontext dashboard --dir <project>`, browse at `http://localhost:3000`:

- Overview stats
- Interactive dependency graph (React Flow)
- File browser and BM25 query UI

Reads `.ai-context/index.json` through `/api/context` when `CODECONTEXT_PROJECT_ROOT` is set.

## Tech stack

- **Language**: TypeScript (Node 18+)
- **CLI**: Commander, Chalk, Ora, Zod config
- **LLM**: Ollama (default), Anthropic SDK, OpenAI SDK
- **Parsing**: Tree-sitter + regex extractors
- **Dashboard**: Next.js 14, React 18, Tailwind, React Flow
- **Build/test**: Turborepo, Vitest (CLI)

## Current maturity

README labels some areas as **stubs/TODO**, but the repo already includes working scan/parse/graph/write paths, LLM integration (including Ollama reachability checks), integration tests, and a published-style CLI package layout. Treat v0.1.0 as an **early but functional** tool with room to deepen Tree-sitter coverage, graph accuracy, and dashboard live-reload.

## One-line pitch

**CodeContext turns your repo into a compact, queryable `.ai-context/` index so AI agents can navigate your codebase without reading every file raw.**
