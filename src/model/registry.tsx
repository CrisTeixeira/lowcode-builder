import type { CSSProperties, ReactNode } from 'react'
import type { ComponentType, Props } from './types'

export type FieldKind = 'text' | 'textarea' | 'number' | 'select' | 'color' | 'boolean'

export interface PropField {
  key: string
  label: string
  kind: FieldKind
  options?: { value: string; label: string }[]
  min?: number
  max?: number
}

export type RenderMode = 'edit' | 'preview'

export interface ComponentDef {
  type: ComponentType
  label: string
  icon: string
  description: string
  isContainer: boolean
  /** false for the root Page, which can't be added from the palette */
  canBeAdded: boolean
  defaultProps: Props
  fields: PropField[]
  render: (props: Props, children: ReactNode, mode: RenderMode) => ReactNode
}

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)
const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const bool = (v: unknown) => v === true

const alignOptions = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
]

const layoutFields: PropField[] = [
  {
    key: 'direction',
    label: 'Direction',
    kind: 'select',
    options: [
      { value: 'column', label: 'Vertical' },
      { value: 'row', label: 'Horizontal' },
    ],
  },
  {
    key: 'align',
    label: 'Align items',
    kind: 'select',
    options: [
      { value: 'stretch', label: 'Stretch' },
      { value: 'flex-start', label: 'Start' },
      { value: 'center', label: 'Center' },
      { value: 'flex-end', label: 'End' },
    ],
  },
  {
    key: 'justify',
    label: 'Justify',
    kind: 'select',
    options: [
      { value: 'flex-start', label: 'Start' },
      { value: 'center', label: 'Center' },
      { value: 'flex-end', label: 'End' },
      { value: 'space-between', label: 'Space between' },
    ],
  },
  { key: 'gap', label: 'Gap (px)', kind: 'number', min: 0, max: 96 },
  { key: 'padding', label: 'Padding (px)', kind: 'number', min: 0, max: 128 },
  { key: 'background', label: 'Background', kind: 'color' },
]

function layoutStyle(p: Props): CSSProperties {
  return {
    display: 'flex',
    flexDirection: str(p.direction, 'column') === 'row' ? 'row' : 'column',
    flexWrap: str(p.direction) === 'row' ? 'wrap' : 'nowrap',
    alignItems: str(p.align, 'stretch'),
    justifyContent: str(p.justify, 'flex-start'),
    gap: num(p.gap, 12),
    padding: num(p.padding, 16),
    background: str(p.background, 'transparent'),
  }
}

const IMAGE_PLACEHOLDER: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  minHeight: 120,
  background: 'repeating-linear-gradient(45deg,#eef0f4,#eef0f4 10px,#e4e7ee 10px,#e4e7ee 20px)',
  color: '#6b7280',
  fontSize: 13,
}

export const registry: Record<ComponentType, ComponentDef> = {
  Page: {
    type: 'Page',
    label: 'Page',
    icon: '▭',
    description: 'The root of the app',
    isContainer: true,
    canBeAdded: false,
    defaultProps: { title: 'My app', direction: 'column', align: 'stretch', justify: 'flex-start', gap: 16, padding: 32, background: '#ffffff' },
    fields: [{ key: 'title', label: 'Page title', kind: 'text' }, ...layoutFields],
    render: (p, children) => <div style={{ ...layoutStyle(p), minHeight: '100%' }}>{children}</div>,
  },

  Container: {
    type: 'Container',
    label: 'Container',
    icon: '▦',
    description: 'Groups components in a row or column',
    isContainer: true,
    canBeAdded: true,
    defaultProps: { direction: 'column', align: 'stretch', justify: 'flex-start', gap: 12, padding: 16, background: '#f5f6fa', radius: 12, maxWidth: 0 },
    fields: [
      ...layoutFields,
      { key: 'radius', label: 'Corner radius (px)', kind: 'number', min: 0, max: 48 },
      { key: 'maxWidth', label: 'Max width (px, 0 = none)', kind: 'number', min: 0, max: 1600 },
    ],
    render: (p, children) => {
      const maxWidth = num(p.maxWidth, 0)
      return (
        <div
          style={{
            ...layoutStyle(p),
            borderRadius: num(p.radius, 12),
            minHeight: 48,
            boxSizing: 'border-box',
            ...(maxWidth > 0 ? { maxWidth, width: '100%', marginInline: 'auto' } : {}),
          }}
        >
          {children}
        </div>
      )
    },
  },

  Heading: {
    type: 'Heading',
    label: 'Heading',
    icon: 'H',
    description: 'A title',
    isContainer: false,
    canBeAdded: true,
    defaultProps: { text: 'Heading', level: '2', color: '#111827', align: 'left' },
    fields: [
      { key: 'text', label: 'Text', kind: 'text' },
      {
        key: 'level',
        label: 'Size',
        kind: 'select',
        options: [
          { value: '1', label: 'Large (H1)' },
          { value: '2', label: 'Medium (H2)' },
          { value: '3', label: 'Small (H3)' },
        ],
      },
      { key: 'align', label: 'Align', kind: 'select', options: alignOptions },
      { key: 'color', label: 'Color', kind: 'color' },
    ],
    render: (p) => {
      const level = str(p.level, '2')
      const style: CSSProperties = {
        margin: 0,
        color: str(p.color, '#111827'),
        textAlign: str(p.align, 'left') as CSSProperties['textAlign'],
        fontSize: level === '1' ? 36 : level === '2' ? 26 : 19,
        lineHeight: 1.2,
      }
      const text = str(p.text)
      if (level === '1') return <h1 style={style}>{text}</h1>
      if (level === '3') return <h3 style={style}>{text}</h3>
      return <h2 style={style}>{text}</h2>
    },
  },

  Text: {
    type: 'Text',
    label: 'Text',
    icon: '¶',
    description: 'A paragraph',
    isContainer: false,
    canBeAdded: true,
    defaultProps: { text: 'Write something here.', size: 16, color: '#374151', align: 'left' },
    fields: [
      { key: 'text', label: 'Text', kind: 'textarea' },
      { key: 'size', label: 'Font size (px)', kind: 'number', min: 10, max: 48 },
      { key: 'align', label: 'Align', kind: 'select', options: alignOptions },
      { key: 'color', label: 'Color', kind: 'color' },
    ],
    render: (p) => (
      <p
        style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          fontSize: num(p.size, 16),
          lineHeight: 1.55,
          color: str(p.color, '#374151'),
          textAlign: str(p.align, 'left') as CSSProperties['textAlign'],
        }}
      >
        {str(p.text)}
      </p>
    ),
  },

  Button: {
    type: 'Button',
    label: 'Button',
    icon: '⬭',
    description: 'A clickable button',
    isContainer: false,
    canBeAdded: true,
    defaultProps: { label: 'Click me', variant: 'primary', fullWidth: false, message: '' },
    fields: [
      { key: 'label', label: 'Label', kind: 'text' },
      {
        key: 'variant',
        label: 'Style',
        kind: 'select',
        options: [
          { value: 'primary', label: 'Primary' },
          { value: 'secondary', label: 'Secondary' },
          { value: 'outline', label: 'Outline' },
        ],
      },
      { key: 'fullWidth', label: 'Full width', kind: 'boolean' },
      { key: 'message', label: 'On click: show message', kind: 'text' },
    ],
    render: (p, _children, mode) => {
      const variant = str(p.variant, 'primary')
      const message = str(p.message)
      return (
        <button
          type="button"
          className={`lc-btn lc-btn--${variant}`}
          style={{ width: bool(p.fullWidth) ? '100%' : undefined }}
          tabIndex={mode === 'edit' ? -1 : undefined}
          // data-message lets the exported HTML (which has no React) show the same message.
          data-message={mode === 'preview' && message ? message : undefined}
          onClick={mode === 'preview' && message ? () => window.alert(message) : undefined}
        >
          {str(p.label)}
        </button>
      )
    },
  },

  Input: {
    type: 'Input',
    label: 'Input',
    icon: '⌨',
    description: 'A text field with a label',
    isContainer: false,
    canBeAdded: true,
    defaultProps: { label: 'Label', placeholder: 'Type here…', inputType: 'text' },
    fields: [
      { key: 'label', label: 'Label', kind: 'text' },
      { key: 'placeholder', label: 'Placeholder', kind: 'text' },
      {
        key: 'inputType',
        label: 'Type',
        kind: 'select',
        options: [
          { value: 'text', label: 'Text' },
          { value: 'email', label: 'Email' },
          { value: 'number', label: 'Number' },
          { value: 'password', label: 'Password' },
        ],
      },
    ],
    render: (p, _children, mode) => (
      <label className="lc-input">
        {str(p.label) && <span>{str(p.label)}</span>}
        <input
          type={str(p.inputType, 'text')}
          placeholder={str(p.placeholder)}
          readOnly={mode === 'edit'}
          tabIndex={mode === 'edit' ? -1 : undefined}
        />
      </label>
    ),
  },

  Image: {
    type: 'Image',
    label: 'Image',
    icon: '◩',
    description: 'An image from a URL',
    isContainer: false,
    canBeAdded: true,
    defaultProps: { src: '', alt: '', width: 100, radius: 8 },
    fields: [
      { key: 'src', label: 'Image URL', kind: 'text' },
      { key: 'alt', label: 'Alt text', kind: 'text' },
      { key: 'width', label: 'Width (%)', kind: 'number', min: 10, max: 100 },
      { key: 'radius', label: 'Corner radius (px)', kind: 'number', min: 0, max: 48 },
    ],
    render: (p) => {
      const style: CSSProperties = { width: `${num(p.width, 100)}%`, borderRadius: num(p.radius, 8), display: 'block' }
      const src = str(p.src)
      if (!src) return <div style={{ ...IMAGE_PLACEHOLDER, ...style }}>Set an image URL</div>
      return <img src={src} alt={str(p.alt)} style={{ ...style, objectFit: 'cover' }} />
    },
  },

  Divider: {
    type: 'Divider',
    label: 'Divider',
    icon: '―',
    description: 'A horizontal line',
    isContainer: false,
    canBeAdded: true,
    defaultProps: { color: '#e5e7eb', thickness: 1, spacing: 8 },
    fields: [
      { key: 'color', label: 'Color', kind: 'color' },
      { key: 'thickness', label: 'Thickness (px)', kind: 'number', min: 1, max: 12 },
      { key: 'spacing', label: 'Spacing (px)', kind: 'number', min: 0, max: 64 },
    ],
    render: (p) => (
      <hr
        style={{
          border: 0,
          borderTop: `${num(p.thickness, 1)}px solid ${str(p.color, '#e5e7eb')}`,
          margin: `${num(p.spacing, 8)}px 0`,
          width: '100%',
        }}
      />
    ),
  },
}

export const componentTypes = Object.keys(registry) as ComponentType[]

export function isComponentType(value: unknown): value is ComponentType {
  return typeof value === 'string' && value in registry
}
