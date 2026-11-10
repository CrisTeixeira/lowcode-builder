# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**lowcode-builder** is a visual low-code editor inspired by OutSystems, built with React 18 + TypeScript + Vite and no UI or drag-and-drop libraries. Users drag components onto a canvas, edit their properties and preview the result. See [README.md](README.md) for features, architecture and the roadmap.

## Commands

```bash
npm run dev        # dev server at http://localhost:5173
npm test           # unit tests (Vitest)
npm run typecheck  # tsc -b
npm run build      # typecheck + production build
npm run lint
```

## Architecture (short version)

- `src/model/`: the core. A normalized document tree (`types.ts`), component definitions with props schema and `render()` (`registry.tsx`), pure tree operations and validation (`document.ts`), and a pure editor reducer with undo/redo (`reducer.ts`). Tests live next to the code (`*.test.ts`).
- `src/editor/`: React UI (canvas with drag & drop, palette, layers, properties panel, preview).
- `src/storage/`: localStorage autosave and JSON import/export.
- Adding a component should only touch `registry.tsx` (plus the `ComponentType` union in `types.ts`).

## How to work in this repo

- **Communication:** the owner is learning Git and the terminal. Explain things in simple European Portuguese, one step at a time, and explain the code, not just the commands.
- **Work in phases** following the README roadmap. Split each phase into small, focused commits with clear English commit messages (imperative mood, e.g. "Add HTML exporter for leaf components").
- **Before every code commit:** run `npm test` and `npm run build`, and only commit if both pass.
- **Always ask for confirmation** before any command that changes something (`git add`, `git commit`, `git push`, installing packages, etc.).
- **Never** delete files, and never run `git reset`, `git clean`, `git restore`, `git checkout --` or `git push --force`.
- Keep the reducer and the model pure and unit-tested. Prefer data-driven changes through the registry.
