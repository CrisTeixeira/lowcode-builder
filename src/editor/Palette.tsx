import { createId, findParentId } from '../model/document'
import { componentTypes, registry } from '../model/registry'
import type { ComponentType } from '../model/types'
import { useEditor } from './EditorContext'

export function Palette() {
  const { doc, selectedId, dispatch, setDrag, setDropTarget } = useEditor()

  /** Click-to-add: inside the selected container, after the selected leaf, or at the end of the page. */
  const addByClick = (type: ComponentType) => {
    const selected = selectedId ? doc.nodes[selectedId] : null
    let parentId = doc.rootId
    let index = doc.nodes[doc.rootId].children.length
    if (selected && registry[selected.type].isContainer) {
      parentId = selected.id
      index = selected.children.length
    } else if (selected) {
      parentId = findParentId(doc, selected.id) ?? doc.rootId
      index = doc.nodes[parentId].children.indexOf(selected.id) + 1
    }
    dispatch({ type: 'add', componentType: type, id: createId(type), parentId, index })
  }

  return (
    <section className="panel">
      <h2 className="panel-title">Components</h2>
      <p className="panel-hint">Drag onto the canvas, or click to add.</p>
      <div className="palette">
        {componentTypes
          .filter((type) => registry[type].canBeAdded)
          .map((type) => {
            const def = registry[type]
            return (
              <button
                key={type}
                type="button"
                className="palette-item"
                draggable
                title={def.description}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'copy'
                  e.dataTransfer.setData('text/plain', type)
                  setDrag({ kind: 'new', componentType: type })
                }}
                onDragEnd={() => {
                  setDrag(null)
                  setDropTarget(null)
                }}
                onClick={() => addByClick(type)}
              >
                <span className="palette-icon" aria-hidden>
                  {def.icon}
                </span>
                {def.label}
              </button>
            )
          })}
      </div>
    </section>
  )
}
