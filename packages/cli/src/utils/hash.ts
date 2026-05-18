import { createHash } from 'crypto';

export function sha256Hex(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export function fileJsonSlug(relativePath: string): string {
  const h = sha256Hex(relativePath).slice(0, 16);
  const safe = relativePath.replace(/[^a-zA-Z0-9-_.]/g, '_').slice(-96);
  return `${h}_${safe}`;
}
