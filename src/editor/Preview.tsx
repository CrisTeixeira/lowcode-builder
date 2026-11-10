import type { ReactNode } from 'react'
import { registry } from '../model/registry'
import type { AppDoc } from '../model/types'

/** Renders the document as the final app would look: no editor outlines, fully interactive. */
function renderDoc(doc: AppDoc, id = doc.rootId): ReactNode {
  const node = doc.nodes[id]
  if (!node) return null
  const children = node.children.map((childId) => <PreviewNode key={childId} doc={doc} id={childId} />)
  return registry[node.type].render(node.props, children, 'preview')
}

function PreviewNode({ doc, id }: { doc: AppDoc; id: string }) {
  return <>{renderDoc(doc, id)}</>
}

export function Preview({ doc, width }: { doc: AppDoc; width: number | null }) {
  return (
    <div className="canvas-scroll">
      <div className="canvas-frame is-preview" style={{ maxWidth: width ?? undefined }}>
        {renderDoc(doc)}
      </div>
    </div>
  )
}
