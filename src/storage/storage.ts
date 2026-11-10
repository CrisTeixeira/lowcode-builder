import { validateDoc } from '../model/document'
import type { AppDoc } from '../model/types'

const STORAGE_KEY = 'lowcode-builder:doc'

/** Loads the autosaved document, or null if there is none / it's broken. */
export function loadSaved(): AppDoc | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? validateDoc(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function save(doc: AppDoc): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc))
    return true
  } catch {
    return false
  }
}

export function downloadJson(doc: AppDoc, filename: string) {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function readJsonFile(file: File): Promise<AppDoc> {
  const text = await file.text()
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  return validateDoc(data)
}
