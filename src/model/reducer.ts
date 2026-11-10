import {
  createEmptyDoc,
  createNode,
  duplicateNode,
  findParentId,
  insertNode,
  moveNode,
  removeNode,
  updateProps,
} from './document'
import type { AppDoc, ComponentType, Props } from './types'

export const HISTORY_LIMIT = 100

export interface EditorState {
  past: AppDoc[]
  present: AppDoc
  future: AppDoc[]
  selectedId: string | null
  /** Consecutive edits with the same key are merged into one undo step (e.g. typing). */
  lastMergeKey: string | null
}

export type EditorAction =
  | { type: 'add'; componentType: ComponentType; id: string; parentId: string; index: number }
  | { type: 'move'; id: string; parentId: string; index: number }
  | { type: 'updateProps'; id: string; patch: Props }
  | { type: 'delete'; id: string }
  | { type: 'duplicate'; id: string; idMap: Record<string, string> }
  | { type: 'select'; id: string | null }
  | { type: 'load'; doc: AppDoc }
  | { type: 'undo' }
  | { type: 'redo' }

export function createInitialState(doc: AppDoc = createEmptyDoc()): EditorState {
  return { past: [], present: doc, future: [], selectedId: null, lastMergeKey: null }
}

function commit(state: EditorState, next: AppDoc, selectedId: string | null, mergeKey: string | null = null): EditorState {
  if (next === state.present) return { ...state, selectedId, lastMergeKey: null }
  if (mergeKey !== null && mergeKey === state.lastMergeKey) {
    return { ...state, present: next, future: [], selectedId, lastMergeKey: mergeKey }
  }
  return {
    past: [...state.past, state.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
    selectedId,
    lastMergeKey: mergeKey,
  }
}

const keepSelection = (doc: AppDoc, id: string | null) => (id && doc.nodes[id] ? id : null)

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const doc = state.present
  switch (action.type) {
    case 'add': {
      const next = insertNode(doc, createNode(action.componentType, action.id), action.parentId, action.index)
      return commit(state, next, next === doc ? state.selectedId : action.id)
    }
    case 'move':
      return commit(state, moveNode(doc, action.id, action.parentId, action.index), action.id)
    case 'updateProps': {
      const mergeKey = `props:${action.id}:${Object.keys(action.patch).sort().join(',')}`
      return commit(state, updateProps(doc, action.id, action.patch), state.selectedId, mergeKey)
    }
    case 'delete': {
      const parentId = findParentId(doc, action.id)
      const next = removeNode(doc, action.id)
      return commit(state, next, next === doc ? state.selectedId : parentId)
    }
    case 'duplicate': {
      const next = duplicateNode(doc, action.id, action.idMap)
      return commit(state, next, next === doc ? state.selectedId : action.idMap[action.id])
    }
    case 'select':
      return { ...state, selectedId: keepSelection(doc, action.id), lastMergeKey: null }
    case 'load':
      return commit(state, action.doc, null)
    case 'undo': {
      const previous = state.past[state.past.length - 1]
      if (!previous) return state
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [doc, ...state.future],
        selectedId: keepSelection(previous, state.selectedId),
        lastMergeKey: null,
      }
    }
    case 'redo': {
      const [next, ...rest] = state.future
      if (!next) return state
      return {
        past: [...state.past, doc],
        present: next,
        future: rest,
        selectedId: keepSelection(next, state.selectedId),
        lastMergeKey: null,
      }
    }
  }
}
