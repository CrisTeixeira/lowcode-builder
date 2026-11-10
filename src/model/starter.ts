import { createNode } from './document'
import type { AppDoc, ComponentType, LcNode, Props } from './types'

type Spec = [ComponentType, Props?, Spec[]?]

/** Builds a small sign-up page so the editor doesn't open empty. */
export function createStarterDoc(): AppDoc {
  const nodes: Record<string, LcNode> = {}
  let counter = 0

  const build = ([type, props, children = []]: Spec): string => {
    const id = type === 'Page' ? 'root' : `${type.toLowerCase()}_starter${++counter}`
    const node = createNode(type, id, props)
    node.children = children.map(build)
    nodes[id] = node
    return id
  }

  build([
    'Page',
    { title: 'Trail Club', background: '#eef2ff', padding: 40 },
    [
      [
        'Container',
        { background: '#ffffff', padding: 32, gap: 16, radius: 16, maxWidth: 520 },
        [
          ['Heading', { text: 'Join the Trail Club', level: '1', color: '#312e81' }],
          ['Text', { text: 'Weekly group runs, route tips and race discounts. Sign up in 30 seconds.', color: '#4b5563' }],
          ['Divider', {}],
          ['Input', { label: 'Name', placeholder: 'Your name' }],
          ['Input', { label: 'Email', placeholder: 'you@example.com', inputType: 'email' }],
          [
            'Container',
            { direction: 'row', background: 'transparent', padding: 0, gap: 8, justify: 'flex-end' },
            [
              ['Button', { label: 'Maybe later', variant: 'outline' }],
              ['Button', { label: 'Sign up', message: 'Welcome to the club!' }],
            ],
          ],
        ],
      ],
    ],
  ])

  return { version: 1, rootId: 'root', nodes }
}
