import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { parse } from 'yaml';
import type { ParliamentConfig, ModelsConfig } from '../types.js';

export async function loadParliamentConfig(configDir: string): Promise<ParliamentConfig> {
  const raw = await readFile(resolve(configDir, 'parliament.yaml'), 'utf-8');
  return parse(raw) as ParliamentConfig;
}

export async function loadModelsConfig(configDir: string): Promise<ModelsConfig> {
  const raw = await readFile(resolve(configDir, 'models.yaml'), 'utf-8');
  return parse(raw) as ModelsConfig;
}

export async function loadManifesto(manifestoDir: string, filename: string): Promise<string> {
  return readFile(resolve(manifestoDir, filename), 'utf-8');
}

export function resolveConfigDir(base: string): string {
  return resolve(base, 'src', 'config');
}

export function resolveManifestoDir(base: string): string {
  return resolve(base, 'src', 'parties', 'manifesto');
}
