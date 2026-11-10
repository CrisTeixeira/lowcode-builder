import { registry } from '../model/registry'
import { useEditor } from './EditorContext'

function summary(props: Record<string, unknown>): string {
  const text = props.text ?? props.label ?? props.title
  return typeof text === 'string' ? text : ''
}

function LayerRow({ id, depth }: { id: string; depth: number }) {
  const { doc, selectedId, dispatch } = useEditor()
  const node = doc.nodes[id]
  if (!node) return null
  const def = registry[node.type]
  return (
    <li>
      <button
        type="button"
        className={`layer-row${selectedId === id ? ' is-selected' : ''}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => dispatch({ type: 'select', id })}
      >
        <span className="layer-icon" aria-hidden>
          {def.icon}
        </span>
        <span className="layer-type">{def.label}</span>
        <span className="layer-summary">{summary(node.props)}</span>
      </button>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <LayerRow key={child} id={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function LayersPanel() {
  const { doc } = useEditor()
  return (
    <section className="panel panel-grow">
      <h2 className="panel-title">Layers</h2>
      <ul className="layers">
        <LayerRow id={doc.rootId} depth={0} />
      </ul>
    </section>
  )
}
