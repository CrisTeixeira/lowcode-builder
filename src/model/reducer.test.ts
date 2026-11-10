import { describe, expect, it } from 'vitest'
import { createEmptyDoc, findParentId, makeIdMap } from './document'
import { createInitialState, editorReducer, type EditorAction, type EditorState } from './reducer'

const run = (actions: EditorAction[], state: EditorState = createInitialState()) => actions.reduce(editorReducer, state)

const add = (componentType: 'Container' | 'Text' | 'Button', id: string, parentId = 'root', index = 99): EditorAction => ({
  type: 'add',
  componentType,
  id,
  parentId,
  index,
})

describe('editorReducer', () => {
  it('adds a component with default props and selects it', () => {
    const s = run([add('Text', 't1')])
    expect(s.present.nodes.root.children).toEqual(['t1'])
    expect(s.present.nodes.t1.props.text).toBe('Write something here.')
    expect(s.selectedId).toBe('t1')
  })

  it('does not add children to non-container components', () => {
    const s = run([add('Text', 't1'), add('Button', 'b1', 't1')])
    expect(s.present.nodes.b1).toBeUndefined()
    expect(s.past).toHaveLength(1)
  })

  it('reorders inside the same parent', () => {
    const s = run([add('Text', 'a'), add('Text', 'b'), add('Text', 'c'), { type: 'move', id: 'a', parentId: 'root', index: 3 }])
    expect(s.present.nodes.root.children).toEqual(['b', 'c', 'a'])
  })

  it('moves a node into another container', () => {
    const s = run([add('Container', 'box'), add('Text', 't'), { type: 'move', id: 't', parentId: 'box', index: 0 }])
    expect(s.present.nodes.root.children).toEqual(['box'])
    expect(s.present.nodes.box.children).toEqual(['t'])
  })

  it('refuses to move a container into its own descendant', () => {
    const s = run([
      add('Container', 'outer'),
      add('Container', 'inner', 'outer'),
      { type: 'move', id: 'outer', parentId: 'inner', index: 0 },
    ])
    expect(findParentId(s.present, 'inner')).toBe('outer')
    expect(findParentId(s.present, 'outer')).toBe('root')
  })

  it('deletes a whole subtree and selects the parent', () => {
    const s = run([add('Container', 'box'), add('Text', 't', 'box'), { type: 'delete', id: 'box' }])
    expect(Object.keys(s.present.nodes)).toEqual(['root'])
    expect(s.selectedId).toBe('root')
  })

  it('never deletes the root page', () => {
    const s = run([{ type: 'delete', id: 'root' }])
    expect(s.present.nodes.root).toBeDefined()
    expect(s.past).toHaveLength(0)
  })

  it('duplicates a subtree with fresh ids right after the original', () => {
    const s1 = run([add('Container', 'box'), add('Text', 't', 'box')])
    const idMap = makeIdMap(s1.present, 'box')
    const s2 = editorReducer(s1, { type: 'duplicate', id: 'box', idMap })
    const copyId = idMap.box
    expect(s2.present.nodes.root.children).toEqual(['box', copyId])
    expect(s2.present.nodes[copyId].children).toEqual([idMap.t])
    expect(s2.selectedId).toBe(copyId)
  })

  it('undoes and redoes', () => {
    const s = run([add('Text', 'a'), add('Text', 'b'), { type: 'undo' }])
    expect(s.present.nodes.root.children).toEqual(['a'])
    const redone = editorReducer(s, { type: 'redo' })
    expect(redone.present.nodes.root.children).toEqual(['a', 'b'])
  })

  it('clears redo history after a new change', () => {
    const s = run([add('Text', 'a'), { type: 'undo' }, add('Text', 'b')])
    expect(s.future).toHaveLength(0)
  })

  it('merges consecutive edits of the same prop into one undo step', () => {
    const s = run([
      add('Text', 't'),
      { type: 'updateProps', id: 't', patch: { text: 'H' } },
      { type: 'updateProps', id: 't', patch: { text: 'He' } },
      { type: 'updateProps', id: 't', patch: { text: 'Hey' } },
      { type: 'undo' },
    ])
    expect(s.present.nodes.t.props.text).toBe('Write something here.')
  })

  it('starts a new undo step when a different prop is edited', () => {
    const s = run([
      add('Text', 't'),
      { type: 'updateProps', id: 't', patch: { text: 'Hey' } },
      { type: 'updateProps', id: 't', patch: { color: '#ff0000' } },
      { type: 'undo' },
    ])
    expect(s.present.nodes.t.props.text).toBe('Hey')
  })

  it('selection changes are not undoable', () => {
    const s = run([add('Text', 't'), { type: 'select', id: null }, { type: 'select', id: 't' }])
    expect(s.past).toHaveLength(1)
  })

  it('loading a document can be undone', () => {
    const s = run([add('Text', 't'), { type: 'load', doc: createEmptyDoc() }, { type: 'undo' }])
    expect(s.present.nodes.t).toBeDefined()
  })
})
