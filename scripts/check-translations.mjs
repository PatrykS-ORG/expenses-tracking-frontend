import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const localesDir = join(root, 'src/locales')
const srcDir = join(root, 'src')

function flattenKeys(obj, prefix = '') {
  const keys = []
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, path))
    } else {
      keys.push(path)
    }
  }
  return keys
}

function loadLocale(locale) {
  const filePath = join(localesDir, locale, 'translation.json')
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

function collectSourceFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      if (entry === 'locales') continue
      collectSourceFiles(fullPath, files)
    } else if (/\.(tsx|ts)$/.test(entry) && !entry.endsWith('.d.ts')) {
      files.push(fullPath)
    }
  }
  return files
}

function extractTranslationKeysFromSource(content) {
  const keys = new Set()
  const patterns = [
    /\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]/g,
    /\bi18n\.t\(\s*['"]([a-zA-Z0-9_.]+)['"]/g,
  ]
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      keys.add(match[1])
    }
  }
  return keys
}

function diffSets(a, b) {
  return [...a].filter((item) => !b.has(item)).sort()
}

const pl = loadLocale('pl')
const en = loadLocale('en')
const plKeys = new Set(flattenKeys(pl))
const enKeys = new Set(flattenKeys(en))

const missingInEn = diffSets(plKeys, enKeys)
const missingInPl = diffSets(enKeys, plKeys)

let failed = false

if (missingInEn.length > 0) {
  failed = true
  console.error('Missing keys in en/translation.json:')
  for (const key of missingInEn) console.error(`  - ${key}`)
}

if (missingInPl.length > 0) {
  failed = true
  console.error('Missing keys in pl/translation.json:')
  for (const key of missingInPl) console.error(`  - ${key}`)
}

const usedKeys = new Set()
for (const file of collectSourceFiles(srcDir)) {
  const content = readFileSync(file, 'utf8')
  for (const key of extractTranslationKeysFromSource(content)) {
    usedKeys.add(key)
  }
}

const missingUsedInPl = diffSets(usedKeys, plKeys)
const missingUsedInEn = diffSets(usedKeys, enKeys)

if (missingUsedInPl.length > 0) {
  failed = true
  console.error('t() keys used in code but missing from pl/translation.json:')
  for (const key of missingUsedInPl) console.error(`  - ${key}`)
}

if (missingUsedInEn.length > 0) {
  failed = true
  console.error('t() keys used in code but missing from en/translation.json:')
  for (const key of missingUsedInEn) console.error(`  - ${key}`)
}

const unusedInPl = diffSets(plKeys, usedKeys)
if (unusedInPl.length > 0) {
  console.warn('Keys in locale files not referenced via t() in src/ (may be OK):')
  for (const key of unusedInPl.slice(0, 20)) console.warn(`  - ${key}`)
  if (unusedInPl.length > 20) {
    console.warn(`  ... and ${unusedInPl.length - 20} more`)
  }
}

if (failed) {
  console.error('\ni18n check failed. Update both src/locales/pl and src/locales/en.')
  process.exit(1)
}

console.log(
  `i18n check passed (${plKeys.size} keys, ${usedKeys.size} referenced in src/).`,
)
