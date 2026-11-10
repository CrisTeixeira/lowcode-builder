import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { registry } from '../model/registry'
import type { AppDoc } from '../model/types'

/**
 * Renders a node and its subtree with each component's own `render()` in preview mode,
 * so the exported page matches what the editor's preview shows.
 */
function renderTree(doc: AppDoc, id: string): ReactNode {
  const node = doc.nodes[id]
  if (!node) return null
  const children = node.children.map((childId) => <ExportNode key={childId} doc={doc} id={childId} />)
  return registry[node.type].render(node.props, children, 'preview')
}

function ExportNode({ doc, id }: { doc: AppDoc; id: string }) {
  return <>{renderTree(doc, id)}</>
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const BASE_CSS = `*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }`

/** Turns a document into a standalone HTML page (one file, no external dependencies). */
export function exportHtml(doc: AppDoc): string {
  const root = doc.nodes[doc.rootId]
  const rawTitle = typeof root?.props.title === 'string' ? root.props.title.trim() : ''
  const title = escapeHtml(rawTitle || 'My app')
  const body = renderToStaticMarkup(<ExportNode doc={doc} id={doc.rootId} />)

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
${BASE_CSS}
</style>
</head>
<body>
${body}
</body>
</html>
`
}
