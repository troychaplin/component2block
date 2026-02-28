import type { TokenEntry } from '../types.js';
/**
 * Build a clamp() value matching WordPress's fluid typography formula.
 * clamp(min, min + (maxNum - minNum) * ((100vw - 320px) / 1280), max)
 */
export declare function buildFluidClamp(entry: TokenEntry): string | null;
//# sourceMappingURL=fluid.d.ts.map