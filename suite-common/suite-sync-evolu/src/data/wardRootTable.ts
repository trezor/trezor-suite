import { NonEmptyString1000, id, nullOr, object } from '@evolu/common';

/**
 * Per-owner WARD root checkpoint (the authenticated `TreeState`: root, counter, mac).
 * Like the wallet table, this holds a single record per Evolu owner — each wallet
 * has its own owner/instance, so there is one WARD root per store.
 *
 * ADDITIVE / backwards-compatible: a new table, so it doesn't perturb existing
 * labeling data. counter is stored as a string to stay within the string schema
 * primitives used elsewhere here; root/mac are hex (mac/root null == empty tree).
 */
export const WardRootId = id('WardRootId');
export type WardRootId = typeof WardRootId.Type;

const wardRootTableColumns = {
    id: WardRootId,
    root: nullOr(NonEmptyString1000),
    counter: NonEmptyString1000,
    mac: nullOr(NonEmptyString1000),
};

export const WardRootEvoluSchema = object(wardRootTableColumns);

export const WardRootTableSchema = {
    wardRoot: wardRootTableColumns,
};
