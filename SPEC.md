# CodeContext `.ai-context/` specification (v1)

This document describes the on-disk format produced by CodeContext so other tools can consume or extend it.

## Layout

| Path | Description |
|------|-------------|
| `.ai-context/index.json` | Master `ProjectIndex` (see below). |
| `.ai-context/graph.json` | `ProjectGraph` with `version`, `generatedAt`, `nodes`, `edges`. |
| `.ai-context/manifest.json` | `ContextManifest`: per-file `contentHash` for incremental runs. |
| `.ai-context/files/<slug>.json` | One `FileContext` per source file (slug = hash prefix + safe path). |
| `.ai-context/cache/summaries.json` | LLM summary cache (optional; safe to gitignore). |
| `.ai-context/CONTEXT.md` | Human-readable concatenation for agents that prefer Markdown. |
| `.ai-context/.cursorrules.fragment` | Snippet for Cursor rules. |
| `.ai-context/CLAUDE.md` | Short memory-style file for Claude-oriented workflows. |

## `ProjectIndex` (index.json)

- `schemaVersion` (string): e.g. `"1"`.
- `cliVersion` (string, optional): tool version that wrote the index.
- `projectName`, `generatedAt`, `totalFiles`, `languages`, `modules`.
- `files`: `FileContext[]`.
- `graph`: `ProjectGraph`.
- `warnings` (string[], optional): e.g. circular import hints.

## `FileContext`

- `filePath`: POSIX path relative to scanned project root.
- `language`, `purpose`, `summary`.
- `exports`, `imports`, `functions`, `dependencies`, `dbAccess`, `apiUsage` (string arrays).
- Optional: `diagnostics`, `importRecords`, `tags`, `risks`, `entrypoints`, `relatedConcerns`, `contentHash`.

## `ProjectGraph`

- `version`: `"1"`.
- `generatedAt`: ISO-8601 string.
- `nodes`: `GraphNode[]` (`type`: `file` | `module` | `db` | `api`).
- `edges`: `GraphEdge[]` (`relation`: `imports` | `calls` | `writes_to` | `reads_from`).
- `circularDependencyWarnings` (optional).

## Compatibility

- Bump `schemaVersion` and this document when breaking JSON shapes change.
- Parsers should ignore unknown fields for forward compatibility.
