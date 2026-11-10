import { findParentId, makeIdMap } from '../model/document'
import { registry, type PropField } from '../model/registry'
import type { PropValue } from '../model/types'
import { useEditor } from './EditorContext'

function FieldInput({ field, value, onChange }: { field: PropField; value: PropValue | undefined; onChange: (v: PropValue) => void }) {
  const id = `field-${field.key}`
  switch (field.kind) {
    case 'textarea':
      return <textarea id={id} rows={4} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
    case 'number':
      return (
        <input
          id={id}
          type="number"
          min={field.min}
          max={field.max}
          value={typeof value === 'number' ? value : 0}
          onChange={(e) => {
            const n = e.target.valueAsNumber
            if (Number.isFinite(n)) onChange(Math.min(field.max ?? Infinity, Math.max(field.min ?? -Infinity, n)))
          }}
        />
      )
    case 'select':
      return (
        <select id={id} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
    case 'color': {
      const hex = typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff'
      return (
        <div className="color-field">
          <input type="color" aria-label={`${field.label} picker`} value={hex} onChange={(e) => onChange(e.target.value)} />
          <input id={id} type="text" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
        </div>
      )
    }
    case 'boolean':
      return <input id={id} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
    default:
      return <input id={id} type="text" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
  }
}

export function PropertiesPanel() {
  const { doc, selectedId, dispatch } = useEditor()
  const node = selectedId ? doc.nodes[selectedId] : null

  if (!node) {
    return (
      <section className="panel">
        <h2 className="panel-title">Properties</h2>
        <p className="panel-hint">Select a component on the canvas to edit it.</p>
      </section>
    )
  }

  const def = registry[node.type]
  const isRoot = node.id === doc.rootId
  const parentId = findParentId(doc, node.id)
  const siblings = parentId ? doc.nodes[parentId].children : []
  const index = siblings.indexOf(node.id)
  const move = (delta: number) => {
    if (!parentId) return
    // moveNode treats the index as "insert before", so moving down skips one extra slot
    dispatch({ type: 'move', id: node.id, parentId, index: delta > 0 ? index + 2 : index - 1 })
  }

  return (
    <section className="panel">
      <h2 className="panel-title">
        {def.icon} {def.label}
      </h2>
      <p className="panel-hint mono">{node.id}</p>

      {!isRoot && (
        <div className="prop-actions">
          <button type="button" onClick={() => move(-1)} disabled={index <= 0} title="Move up">
            ↑
          </button>
          <button type="button" onClick={() => move(1)} disabled={index >= siblings.length - 1} title="Move down">
            ↓
          </button>
          <button type="button" onClick={() => dispatch({ type: 'duplicate', id: node.id, idMap: makeIdMap(doc, node.id) })} title="Duplicate (Ctrl+D)">
            Duplicate
          </button>
          <button type="button" className="danger" onClick={() => dispatch({ type: 'delete', id: node.id })} title="Delete (Del)">
            Delete
          </button>
        </div>
      )}

      <div className="fields">
        {def.fields.map((field) => (
          <div key={field.key} className={`field field--${field.kind}`}>
            <label htmlFor={`field-${field.key}`}>{field.label}</label>
            <FieldInput
              field={field}
              value={node.props[field.key]}
              onChange={(value) => dispatch({ type: 'updateProps', id: node.id, patch: { [field.key]: value } })}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
