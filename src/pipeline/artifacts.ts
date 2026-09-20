import fs from "node:fs";
import path from "node:path";
import type { z } from "zod";

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function writeJson(file: string, data: unknown) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

export function writeArtifact<T>(dir: string, name: string, schema: z.ZodType<T>, data: T): string {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Artifact ${name} failed validation: ${JSON.stringify(parsed.error.issues.slice(0, 3))}`);
  }
  const file = path.join(dir, `${name}.json`);
  writeJson(file, parsed.data);
  return file;
}

export function readArtifact<T>(dir: string, name: string, schema: z.ZodType<T>): T {
  const file = path.join(dir, `${name}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing artifact ${file}. Run without --from, or from an earlier stage.`);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Artifact ${file} is invalid: ${JSON.stringify(parsed.error.issues.slice(0, 3))}`);
  }
  return parsed.data;
}

export function hasArtifact(dir: string, name: string): boolean {
  return fs.existsSync(path.join(dir, `${name}.json`));
}

export function writeText(file: string, text: string) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, text);
}
