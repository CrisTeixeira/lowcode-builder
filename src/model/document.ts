import { isComponentType, registry } from './registry'
import type { AppDoc, ComponentType, LcNode, Props } from './types'

export function createId(type: ComponentType): string {
  return `${type.toLowerCase()}_${Math.random().toString(36).slice(2, 9)}`
}

export function createNode(type: ComponentType, id: string, props?: Props): LcNode {
  return { id, type, props: { ...registry[type].defaultProps, ...props }, children: [] }
}

export function createEmptyDoc(): AppDoc {
  const root = createNode('Page', 'root')
  return { version: 1, rootId: root.id, nodes: { [root.id]: root } }
}

export function findParentId(doc: AppDoc, id: string): string | null {
  for (const node of Object.values(doc.nodes)) {
    if (node.children.includes(id)) return node.id
  }
  return null
}

/** true if `id` is `ancestorId` itself or lives anywhere inside it */
export function isInside(doc: AppDoc, ancestorId: string, id: string): boolean {
  let current: string | null = id
  while (current) {
    if (current === ancestorId) return true
    current = findParentId(doc, current)
  }
  return false
}

/** All ids of a node and its descendants, depth-first. */
export function collectSubtree(doc: AppDoc, id: string): string[] {
  const node = doc.nodes[id]
  if (!node) return []
  return [id, ...node.children.flatMap((child) => collectSubtree(doc, child))]
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

function canContain(doc: AppDoc, parentId: string): boolean {
  const parent = doc.nodes[parentId]
  return !!parent && registry[parent.type].isContainer
}

function withChildren(doc: AppDoc, parentId: string, children: string[]): AppDoc {
  const parent = doc.nodes[parentId]
  return { ...doc, nodes: { ...doc.nodes, [parentId]: { ...parent, children } } }
}

export function insertNode(doc: AppDoc, node: LcNode, parentId: string, index: number): AppDoc {
  if (!canContain(doc, parentId) || doc.nodes[node.id]) return doc
  const siblings = [...doc.nodes[parentId].children]
  siblings.splice(clamp(index, 0, siblings.length), 0, node.id)
  const next = withChildren(doc, parentId, siblings)
  return { ...next, nodes: { ...next.nodes, [node.id]: node } }
}

export function moveNode(doc: AppDoc, id: string, parentId: string, index: number): AppDoc {
  if (id === doc.rootId || !doc.nodes[id] || !canContain(doc, parentId)) return doc
  // A node can't be dropped into itself or its own descendants.
  if (isInside(doc, id, parentId)) return doc

  const oldParentId = findParentId(doc, id)
  if (!oldParentId) return doc
  const oldIndex = doc.nodes[oldParentId].children.indexOf(id)

  let target = index
  if (oldParentId === parentId && oldIndex < index) target -= 1
  if (oldParentId === parentId && oldIndex === target) return doc

  const removed = withChildren(
    doc,
    oldParentId,
    doc.nodes[oldParentId].children.filter((c) => c !== id),
  )
  const siblings = [...removed.nodes[parentId].children]
  siblings.splice(clamp(target, 0, siblings.length), 0, id)
  return withChildren(removed, parentId, siblings)
}

export function removeNode(doc: AppDoc, id: string): AppDoc {
  if (id === doc.rootId || !doc.nodes[id]) return doc
  const parentId = findParentId(doc, id)
  const nodes = { ...doc.nodes }
  for (const removedId of collectSubtree(doc, id)) delete nodes[removedId]
  if (parentId) {
    nodes[parentId] = { ...nodes[parentId], children: nodes[parentId].children.filter((c) => c !== id) }
  }
  return { ...doc, nodes }
}

export function updateProps(doc: AppDoc, id: string, patch: Props): AppDoc {
  const node = doc.nodes[id]
  if (!node) return doc
  return { ...doc, nodes: { ...doc.nodes, [id]: { ...node, props: { ...node.props, ...patch } } } }
}

/** Builds the old-id → new-id map needed to duplicate a subtree. */
export function makeIdMap(doc: AppDoc, id: string): Record<string, string> {
  return Object.fromEntries(collectSubtree(doc, id).map((oldId) => [oldId, createId(doc.nodes[oldId].type)]))
}

/** Copies a subtree (using the given id map) and inserts it right after the original. */
export function duplicateNode(doc: AppDoc, id: string, idMap: Record<string, string>): AppDoc {
  const parentId = findParentId(doc, id)
  if (!parentId || id === doc.rootId) return doc
  const subtree = collectSubtree(doc, id)
  if (subtree.some((oldId) => !idMap[oldId] || doc.nodes[idMap[oldId]])) return doc

  const nodes = { ...doc.nodes }
  for (const oldId of subtree) {
    const original = doc.nodes[oldId]
    nodes[idMap[oldId]] = {
      ...original,
      id: idMap[oldId],
      props: { ...original.props },
      children: original.children.map((c) => idMap[c]),
    }
  }
  const siblings = [...nodes[parentId].children]
  siblings.splice(siblings.indexOf(id) + 1, 0, idMap[id])
  nodes[parentId] = { ...nodes[parentId], children: siblings }
  return { ...doc, nodes }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Checks that unknown data (e.g. an imported JSON file) is a valid AppDoc.
 * Throws a readable error otherwise. Missing props are filled with defaults.
 */
export function validateDoc(data: unknown): AppDoc {
  if (!isRecord(data)) throw new Error('File is not a JSON object.')
  if (data.version !== 1) throw new Error('Unsupported document version.')
  if (typeof data.rootId !== 'string') throw new Error('Missing rootId.')
  if (!isRecord(data.nodes)) throw new Error('Missing nodes.')

  const nodes: Record<string, LcNode> = {}
  for (const [key, raw] of Object.entries(data.nodes)) {
    if (!isRecord(raw)) throw new Error(`Node "${key}" is invalid.`)
    if (raw.id !== key) throw new Error(`Node "${key}" has a mismatched id.`)
    if (!isComponentType(raw.type)) throw new Error(`Node "${key}" has unknown type "${String(raw.type)}".`)
    if (!isRecord(raw.props)) throw new Error(`Node "${key}" has invalid props.`)
    if (!Array.isArray(raw.children) || !raw.children.every((c) => typeof c === 'string')) {
      throw new Error(`Node "${key}" has invalid children.`)
    }
    const props: Props = { ...registry[raw.type].defaultProps }
    for (const [k, v] of Object.entries(raw.props)) {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') props[k] = v
    }
    nodes[key] = { id: key, type: raw.type, props, children: [...(raw.children as string[])] }
  }

  const root = nodes[data.rootId]
  if (!root || root.type !== 'Page') throw new Error('Root must be a Page.')

  // Every node must be reachable from the root exactly once (a real tree, no cycles).
  const seen = new Set<string>()
  const visit = (id: string) => {
    if (seen.has(id)) throw new Error(`Node "${id}" appears more than once.`)
    const node = nodes[id]
    if (!node) throw new Error(`Child "${id}" does not exist.`)
    if (node.children.length > 0 && !registry[node.type].isContainer) {
      throw new Error(`Node "${id}" (${node.type}) can't have children.`)
    }
    seen.add(id)
    node.children.forEach(visit)
  }
  visit(root.id)
  if (seen.size !== Object.keys(nodes).length) throw new Error('Document has orphan nodes.')

  return { version: 1, rootId: root.id, nodes }
}
