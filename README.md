# Lowcode Builder

A small visual app builder in the spirit of low-code platforms like OutSystems: drag components onto a canvas, nest them in layouts, edit their properties, and preview the result as a working app.

Built with **React 18 + TypeScript + Vite**, with no UI or drag-and-drop libraries. The editor core is a pure, unit-tested reducer.

## Features

- **Drag & drop editing.** Drag from the palette onto the canvas, or drag existing components to reorder them or move them between containers. A drop indicator shows where they will land. You can also click a palette item to add it.
- **Nested layouts.** Containers support rows/columns, alignment, gap, padding, background, corner radius and max width.
- **Components:** Heading, Text, Button (with an on-click message), Input, Image, Divider, Container.
- **Properties panel** with typed fields: text, number, select, color and boolean.
- **Layers panel** showing the component tree.
- **Undo / redo** with a history limit. Consecutive keystrokes in the same field merge into a single undo step.
- **Preview mode** that renders the app without editor chrome, with Desktop, Tablet and Mobile widths.
- **Export to HTML:** download the app as a single standalone `.html` file (styles and button messages included, no dependencies).
- **Autosave** to `localStorage`, plus **JSON import/export**. Imported files are validated (unknown types, cycles, orphan nodes and children on leaf components are all rejected).
- **Keyboard shortcuts:** `Ctrl/Cmd+Z` undo, `Ctrl/Cmd+Shift+Z` or `Ctrl+Y` redo, `Del` delete, `Ctrl/Cmd+D` duplicate, `Esc` deselect.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run typecheck
npm run build
```

## Architecture

```
src/
  model/
    types.ts        Document model: a normalized tree (nodes by id + child id lists)
    registry.tsx    Component definitions: default props, editable fields, render()
    document.ts     Pure tree operations (insert, move, remove, duplicate) + validation
    reducer.ts      Editor state: undo/redo history, selection, edit merging
    starter.ts      Example document shown on first launch
    components.css  Styles for rendered components (shared by editor and export)
  editor/
    Canvas.tsx      Edit-mode renderer, selection and drag & drop
    Palette.tsx     Component palette
    LayersPanel.tsx Tree view
    PropertiesPanel.tsx  Auto-generated forms from each component's field schema
    Preview.tsx     Preview-mode renderer
  export/
    exportHtml.tsx  Renders a document to a standalone HTML page
  storage/
    storage.ts      localStorage autosave, JSON import/export, file downloads
```

### Key design decisions

- **The document is plain JSON.** Nodes live in a flat `Record<id, node>` and each node keeps an ordered list of child ids. Moves and deletes stay cheap, and the whole document can be saved, exported or diffed as-is.
- **Components are data-driven.** Each entry in the registry declares its props schema and a single `render(props, children, mode)` function. The properties panel, the canvas and the preview all come from that one definition, so adding a component touches one file.
- **The reducer is pure.** IDs are generated in action creators rather than inside the reducer, which makes it deterministic, easy to test and safe under React StrictMode.
- **Native HTML5 drag & drop.** The drop index is computed from the pointer position against each child's midpoint, along the container's axis. Containers that can't accept the dragged item (for example, dropping a container into itself) let the event bubble to their parent.

## Roadmap

- [x] **Export to code:** generate a standalone HTML/CSS/JS file from a document.
- [ ] **Export to React:** generate React components from a document.
- [ ] **Logic & events:** visual actions on events (navigate, show/hide, set variable).
- [ ] **App state & data binding:** variables, bind text and inputs to them, form submission.
- [ ] **Multiple pages** with navigation.
- [ ] **Data sources:** fetch from a REST API and bind lists (a repeater component).
- [ ] **Reusable blocks:** save a selection as a custom component.
- [ ] **Responsive overrides:** per-breakpoint props.
- [ ] **Theming:** global colors and typography tokens.
- [ ] **E2E tests** with Playwright for the drag & drop flows.

## License

MIT
