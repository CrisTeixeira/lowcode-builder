import { describe, expect, it } from 'vitest'
import { createEmptyDoc, createNode, insertNode } from '../model/document'
import { createStarterDoc } from '../model/starter'
import { escapeHtml, exportHtml } from './exportHtml'

describe('exportHtml', () => {
  it('produces a complete HTML page with the page title', () => {
    const html = exportHtml(createStarterDoc())
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain('<title>Trail Club</title>')
    expect(html).toContain('</html>')
  })

  it('renders the components of the document', () => {
    const html = exportHtml(createStarterDoc())
    expect(html).toContain('Join the Trail Club</h1>')
    expect(html).toContain('placeholder="you@example.com"')
    expect(html).toContain('>Sign up</button>')
  })

  it('renders in preview mode (inputs are editable)', () => {
    const html = exportHtml(createStarterDoc())
    expect(html).not.toContain('readonly')
    expect(html).not.toContain('tabindex="-1"')
  })

  it('keeps the order of nested children', () => {
    let doc = createEmptyDoc()
    doc = insertNode(doc, createNode('Container', 'box'), doc.rootId, 0)
    doc = insertNode(doc, createNode('Text', 't1', { text: 'Alpha' }), 'box', 0)
    doc = insertNode(doc, createNode('Text', 't2', { text: 'Omega' }), 'box', 1)
    const body = exportHtml(doc).split('<body')[1]
    expect(body.indexOf('Alpha')).toBeGreaterThan(-1)
    expect(body.indexOf('Alpha')).toBeLessThan(body.indexOf('Omega'))
  })

  it('escapes user text so it cannot inject HTML', () => {
    let doc = createEmptyDoc()
    doc.nodes.root.props.title = '</title><script>alert(1)</script>'
    doc = insertNode(doc, createNode('Text', 't', { text: '<img src=x onerror=alert(1)>' }), doc.rootId, 0)
    const html = exportHtml(doc)
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;/title&gt;&lt;script&gt;')
  })

  it('includes the component styles so the file works on its own', () => {
    const html = exportHtml(createStarterDoc())
    expect(html).toContain('.lc-btn--primary')
    expect(html).toContain('.lc-input input')
    expect(html).toContain('<body class="is-preview">')
    expect(html).not.toMatch(/<link[^>]+stylesheet/)
  })

  it('falls back to a default title', () => {
    const doc = createEmptyDoc()
    doc.nodes.root.props.title = '  '
    expect(exportHtml(doc)).toContain('<title>My app</title>')
  })
})

describe('escapeHtml', () => {
  it('escapes the five HTML special characters', () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;')
  })
})
