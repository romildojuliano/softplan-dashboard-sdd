#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.resolve(process.argv[2] ?? path.join(root, '../dashboard_compras_softplan_jan_jul_2026.html'));
const outputPath = path.join(root, 'src/data/dashboard-data.json');

let html;
try {
  html = await readFile(sourcePath, 'utf8');
} catch (error) {
  throw new Error(`Cannot read source HTML ${sourcePath}: ${error.message}`, { cause: error });
}

const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)];
let dataText;
for (const script of scripts) {
  const match = script[1].match(/\bconst\s+DATA\s*=\s*(\{[\s\S]*\});\s*$/);
  if (match) {
    dataText = match[1];
    break;
  }
}
if (!dataText) throw new Error(`No const DATA assignment found in a script in ${sourcePath}`);

let data;
try {
  data = JSON.parse(dataText);
} catch (error) {
  throw new Error(`Invalid JSON in DATA assignment in ${sourcePath}: ${error.message}`, { cause: error });
}
if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('DATA assignment must be a JSON object');
await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Extracted DATA from ${sourcePath} to ${path.relative(root, outputPath)}`);
