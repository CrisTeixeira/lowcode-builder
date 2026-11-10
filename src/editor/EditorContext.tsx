import { createContext, useContext, type Dispatch } from 'react'
import type { EditorAction } from '../model/reducer'
import type { AppDoc, ComponentType } from '../model/types'

/** What is being dragged right now. Kept outside dataTransfer because it can't be read during dragover. */
export type DragPayload = { kind: 'new'; componentType: ComponentType } | { kind: 'move'; id: string }

export interface DropTarget {
  parentId: string
  index: number
}

export interface EditorContextValue {
  doc: AppDoc
  selectedId: string | null
  dispatch: Dispatch<EditorAction>
  drag: DragPayload | null
  setDrag: (drag: DragPayload | null) => void
  dropTarget: DropTarget | null
  setDropTarget: (target: DropTarget | null) => void
}

export const EditorContext = createContext<EditorContextValue | null>(null)

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used inside <EditorContext.Provider>')
  return ctx
}
