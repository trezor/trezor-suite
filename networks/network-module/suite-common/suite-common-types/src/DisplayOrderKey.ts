import type { Branded } from '@trezor/type-utils';

// Fractional-indexing key: networks sort by byte-wise comparison, so a new key can be inserted
// between two existing ones (e.g. `a0V` between `a0` and `a1`) without renumbering others.
export type DisplayOrderKey = string & Branded<'DisplayOrderKey'>;

export const asDisplayOrderKey = (key: string): DisplayOrderKey => key as DisplayOrderKey;
