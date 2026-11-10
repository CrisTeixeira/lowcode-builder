import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Canvas } from './editor/Canvas'
import { EditorContext, type DragPayload, type DropTarget, type EditorContextValue } from './editor/EditorContext'
import { LayersPanel } from './editor/LayersPanel'
import { Palette } from './editor/Palette'
import { Preview } from './editor/Preview'
import { PropertiesPanel } from './editor/PropertiesPanel'
import { createEmptyDoc, makeIdMap } from './model/document'
import { createInitialState, editorReducer } from './model/reducer'
import { createStarterDoc } from './model/starter'
import { downloadJson, loadSaved, readJsonFile, save } from './storage/storage'

const VIEWPORTS = [
  { id: 'desktop', label: 'Desktop', width: null },
  { id: 'tablet', label: 'Tablet', width: 768 },
  { id: 'mobile', label: 'Mobile', width: 390 },
] as const

type ViewportId = (typeof VIEWPORTS)[number]['id']

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

export default function App() {
  const [state, dispatch] = useReducer(editorReducer, undefined, () => createInitialState(loadSaved() ?? createStarterDoc()))
  const [drag, setDrag] = useState<DragPayload | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [viewport, setViewport] = useState<ViewportId>('desktop')
  const [status, setStatus] = useState<string>('')
  const fileInput = useRef<HTMLInputElement>(null)

  const doc = state.present
  const width = VIEWPORTS.find((v) => v.id === viewport)?.width ?? null
  const title = String(doc.nodes[doc.rootId].props.title || 'Untitled app')

  // Autosave (debounced) whenever the document changes.
  useEffect(() => {
    const timer = window.setTimeout(() => setStatus(save(doc) ? 'Saved' : 'Could not save locally'), 400)
    // Flush immediately if the tab closes before the debounce fires.
    const flush = () => save(doc)
    window.addEventListener('pagehide', flush)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pagehide', flush)
    }
  }, [doc])

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      if (mod && key === 'z') {
        e.preventDefault()
        dispatch({ type: e.shiftKey ? 'redo' : 'undo' })
      } else if (mod && key === 'y') {
        e.preventDefault()
        dispatch({ type: 'redo' })
      } else if (mode === 'edit' && state.selectedId && state.selectedId !== doc.rootId) {
        if (key === 'delete' || key === 'backspace') {
          e.preventDefault()
          dispatch({ type: 'delete', id: state.selectedId })
        } else if (mod && key === 'd') {
          e.preventDefault()
          dispatch({ type: 'duplicate', id: state.selectedId, idMap: makeIdMap(doc, state.selectedId) })
        }
      }
      if (key === 'escape') dispatch({ type: 'select', id: null })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doc, mode, state.selectedId])

  const ctx = useMemo<EditorContextValue>(
    () => ({ doc, selectedId: state.selectedId, dispatch, drag, setDrag, dropTarget, setDropTarget }),
    [doc, state.selectedId, drag, dropTarget],
  )

  const importFile = async (file: File | undefined) => {
    if (!file) return
    try {
      dispatch({ type: 'load', doc: await readJsonFile(file) })
      setStatus(`Imported ${file.name}`)
    } catch (err) {
      window.alert(`Could not import: ${(err as Error).message}`)
    }
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app'

  return (
    <EditorContext.Provider value={ctx}>
      <div className="app">
        <header className="toolbar">
          <div className="brand">
            <img src="/favicon.svg" alt="" width={22} height={22} />
            <strong>Lowcode Builder</strong>
            <span className="doc-title">{title}</span>
          </div>

          <div className="toolbar-group">
            <button type="button" onClick={() => dispatch({ type: 'undo' })} disabled={state.past.length === 0} title="Undo (Ctrl+Z)">
              ↶ Undo
            </button>
            <button type="button" onClick={() => dispatch({ type: 'redo' })} disabled={state.future.length === 0} title="Redo (Ctrl+Shift+Z)">
              ↷ Redo
            </button>
          </div>

          <div className="toolbar-group segmented" role="group" aria-label="Viewport">
            {VIEWPORTS.map((v) => (
              <button key={v.id} type="button" aria-pressed={viewport === v.id} onClick={() => setViewport(v.id)}>
                {v.label}
              </button>
            ))}
          </div>

          <div className="toolbar-group">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Start a new empty app? (You can undo this.)')) dispatch({ type: 'load', doc: createEmptyDoc() })
              }}
            >
              New
            </button>
            <button type="button" onClick={() => fileInput.current?.click()}>
              Import
            </button>
            <button type="button" onClick={() => downloadJson(doc, `${slug}.json`)}>
              Export JSON
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                void importFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <button type="button" className="primary" aria-pressed={mode === 'preview'} onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}>
              {mode === 'edit' ? '▶ Preview' : '✎ Edit'}
            </button>
          </div>

          <span className="status" aria-live="polite">
            {status}
          </span>
        </header>

        {mode === 'edit' ? (
          <main className="workspace">
            <aside className="sidebar sidebar-left">
              <Palette />
              <LayersPanel />
            </aside>
            <Canvas width={width} />
            <aside className="sidebar sidebar-right">
              <PropertiesPanel />
            </aside>
          </main>
        ) : (
          <main className="workspace is-preview">
            <Preview doc={doc} width={width} />
          </main>
        )}
      </div>
    </EditorContext.Provider>
  )
}
