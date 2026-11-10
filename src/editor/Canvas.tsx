import type { DragEvent } from 'react'
import { createId, isInside } from '../model/document'
import { registry } from '../model/registry'
import { useEditor } from './EditorContext'

/**
 * Finds the insertion index inside a container from the mouse position,
 * comparing it to the middle of each child along the layout axis.
 */
function dropIndex(container: HTMLElement, parentId: string, horizontal: boolean, e: DragEvent): number {
  const children = Array.from(container.querySelectorAll<HTMLElement>(`[data-parent-id="${parentId}"]`))
  for (let i = 0; i < children.length; i++) {
    const rect = children[i].getBoundingClientRect()
    if (horizontal) {
      // rows can wrap: only compare x for children on the same line as the pointer
      if (e.clientY < rect.top) return i
      if (e.clientY <= rect.bottom && e.clientX < rect.left + rect.width / 2) return i
    } else if (e.clientY < rect.top + rect.height / 2) {
      return i
    }
  }
  return children.length
}

function NodeView({ id, parentId }: { id: string; parentId: string | null }) {
  const { doc, selectedId, dispatch, drag, setDrag, dropTarget, setDropTarget } = useEditor()
  const node = doc.nodes[id]
  if (!node) return null
  const def = registry[node.type]
  const isRoot = id === doc.rootId
  const isTarget = dropTarget?.parentId === id

  const canAccept = () => {
    if (!def.isContainer || !drag) return false
    return drag.kind === 'new' || !isInside(doc, drag.id, id)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    // Let the event bubble to an outer container if this one can't take the item.
    if (!canAccept()) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = drag?.kind === 'new' ? 'copy' : 'move'
    const index = dropIndex(e.currentTarget, id, node.props.direction === 'row', e)
    if (dropTarget?.parentId !== id || dropTarget.index !== index) setDropTarget({ parentId: id, index })
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!canAccept() || !drag) return
    e.preventDefault()
    e.stopPropagation()
    const index = dropTarget?.parentId === id ? dropTarget.index : node.children.length
    if (drag.kind === 'new') {
      dispatch({ type: 'add', componentType: drag.componentType, id: createId(drag.componentType), parentId: id, index })
    } else {
      dispatch({ type: 'move', id: drag.id, parentId: id, index })
    }
    setDrag(null)
    setDropTarget(null)
  }

  const children = def.isContainer ? (
    node.children.length > 0 ? (
      node.children.map((childId, i) => {
        const before = isTarget && dropTarget.index === i
        const after = isTarget && dropTarget.index === node.children.length && i === node.children.length - 1
        return (
          <div
            key={childId}
            className={`lc-slot${before ? ' drop-before' : ''}${after ? ' drop-after' : ''}${node.props.direction === 'row' ? ' is-row' : ''}`}
            data-parent-id={id}
          >
            <NodeView id={childId} parentId={id} />
          </div>
        )
      })
    ) : (
      <div className="lc-empty">{isRoot ? 'Drag components from the left panel' : 'Drop components here'}</div>
    )
  ) : null

  const classes = [
    'lc-node',
    isRoot && 'is-root',
    def.isContainer && 'is-container',
    selectedId === id && 'is-selected',
    isTarget && 'is-drop-target',
    drag?.kind === 'move' && drag.id === id && 'is-dragging',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      data-node-id={id}
      draggable={!isRoot}
      onDragStart={(e) => {
        e.stopPropagation()
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', id)
        setDrag({ kind: 'move', id })
      }}
      onDragEnd={() => {
        setDrag(null)
        setDropTarget(null)
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={(e) => {
        e.stopPropagation()
        dispatch({ type: 'select', id })
      }}
      aria-label={`${def.label}${parentId ? '' : ' (root)'}`}
    >
      {!isRoot && <span className="lc-node-badge">{def.label}</span>}
      {def.render(node.props, children, 'edit')}
    </div>
  )
}

export function Canvas({ width }: { width: number | null }) {
  const { doc, dispatch, setDropTarget } = useEditor()
  return (
    <div
      className="canvas-scroll"
      onClick={() => dispatch({ type: 'select', id: null })}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropTarget(null)
      }}
    >
      <div className="canvas-frame" style={{ maxWidth: width ?? undefined }}>
        <NodeView id={doc.rootId} parentId={null} />
      </div>
    </div>
  )
}
