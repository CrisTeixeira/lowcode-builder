import { describe, expect, it } from 'vitest'
import { createEmptyDoc, validateDoc } from './document'
import { createStarterDoc } from './starter'

const roundTrip = (doc: unknown) => validateDoc(JSON.parse(JSON.stringify(doc)))

describe('validateDoc', () => {
  it('accepts the starter and empty documents', () => {
    expect(roundTrip(createStarterDoc())).toEqual(createStarterDoc())
    expect(roundTrip(createEmptyDoc())).toEqual(createEmptyDoc())
  })

  it('fills in missing props with defaults', () => {
    const doc = createEmptyDoc()
    doc.nodes.root.props = {}
    expect(roundTrip(doc).nodes.root.props.padding).toBe(32)
  })

  it('rejects unknown component types', () => {
    const doc = JSON.parse(JSON.stringify(createEmptyDoc()))
    doc.nodes.x = { id: 'x', type: 'Spaceship', props: {}, children: [] }
    doc.nodes.root.children.push('x')
    expect(() => validateDoc(doc)).toThrow(/unknown type/)
  })

  it('rejects cycles and shared children', () => {
    const doc = JSON.parse(JSON.stringify(createEmptyDoc()))
    doc.nodes.c = { id: 'c', type: 'Container', props: {}, children: ['c'] }
    doc.nodes.root.children.push('c')
    expect(() => validateDoc(doc)).toThrow(/more than once/)
  })

  it('rejects orphan nodes', () => {
    const doc = JSON.parse(JSON.stringify(createEmptyDoc()))
    doc.nodes.t = { id: 't', type: 'Text', props: {}, children: [] }
    expect(() => validateDoc(doc)).toThrow(/orphan/)
  })

  it('rejects children on leaf components', () => {
    const doc = JSON.parse(JSON.stringify(createEmptyDoc()))
    doc.nodes.t = { id: 't', type: 'Text', props: {}, children: ['u'] }
    doc.nodes.u = { id: 'u', type: 'Text', props: {}, children: [] }
    doc.nodes.root.children.push('t')
    expect(() => validateDoc(doc)).toThrow(/can't have children/)
  })

  it('rejects non-objects', () => {
    expect(() => validateDoc('hello')).toThrow()
    expect(() => validateDoc(null)).toThrow()
  })
})
