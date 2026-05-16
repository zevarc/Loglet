/**
 * Share-link encoder.
 *
 * Encodes logcat text + view state into a URL hash payload.
 * Strategy (see ARCHITECTURE §7.3 / ROADMAP Phase 2 week 5):
 *   1. Serialize { text, filters, bookmarks } as JSON
 *   2. gzip with pako
 *   3. base64url-encode
 *   4. Cap at 100 KB; surface error otherwise.
 */

// import { deflate } from 'pako';
// import type { FilterState } from '../types';

// export function encodePayload(text: string, filters: FilterState): string { ... }
export const MAX_PAYLOAD_BYTES = 100 * 1024;
