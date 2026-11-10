export type ComponentType =
  | 'Page'
  | 'Container'
  | 'Heading'
  | 'Text'
  | 'Button'
  | 'Input'
  | 'Image'
  | 'Divider'

export type PropValue = string | number | boolean
export type Props = Record<string, PropValue>

/** A single element in the app tree. Children are stored as ids (flat, normalized tree). */
export interface LcNode {
  id: string
  type: ComponentType
  props: Props
  children: string[]
}

/** The whole app being designed. Serializable to JSON as-is. */
export interface AppDoc {
  version: 1
  rootId: string
  nodes: Record<string, LcNode>
}
