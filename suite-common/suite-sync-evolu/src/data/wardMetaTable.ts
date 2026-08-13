// FIXME(ward, UNWIRED): no reader. The Evolu-backed WardProvider that used these
// (createEvoluWardDataProvider) was deleted -- it imported AuthLabelEntry/
// AuthLabelProvider/AuthLabelRow, type names that no longer exist in @trezor/ward, so
// it could not type-check, and it had no consumer. These tables ALSO cannot back the
// current contract: there is no entryKey, no leaf envelope (identity/content) and no
// transitions column, so a proof could never be served from them. A rewrite must add
// those columns first (planned_fixes Gap 5). Table kept for the per-entry schema shape.

import { NonEmptyString1000, createIdFromString, id, nullOr, object } from '@evolu/common';

import { type NetworkSymbol } from '@suite-common/wallet-config';

/**
 * WARD-authenticated label entry. Self-sufficient (carries its own address /
 * networkSymbol / label) so it does NOT touch the shared `address` table — the
 * existing account-labeling row requires an `accountDescriptor` the WARD provider
 * interface has no source for, and staying self-contained means WARD adds a table
 * and perturbs nothing. It augments the label *system* (a WARD entry is a label +
 * the authentication fields counter/dataMac), just not the same physical row.
 *
 * ADDITIVE / backwards-compatible: a new table; existing labeling untouched.
 * counter is a stringified global counter stamp; dataMac is hex; label may be null.
 *
 * NOTE: like `createSuiteSyncAddressId`, this id is derived from the plaintext
 * address and is therefore membership-probeable (see WM-evolu-callback.md, "Attack B
 * is LIVE"). Hardening the id to an owner-secret HMAC is a separate, NON-backwards-
 * compatible key-migration and is intentionally not done here.
 */
export const WardMetaId = id('WardMetaId');
export type WardMetaId = typeof WardMetaId.Type;

export const createWardMetaId = (address: string, networkSymbol: NetworkSymbol) =>
    WardMetaId.from(createIdFromString(`${address}-${networkSymbol}`));

const wardMetaTableColumns = {
    id: WardMetaId,
    address: NonEmptyString1000,
    networkSymbol: NonEmptyString1000,
    label: nullOr(NonEmptyString1000),
    counter: NonEmptyString1000,
    dataMac: nullOr(NonEmptyString1000),
};

export const WardMetaEvoluSchema = object(wardMetaTableColumns);

export const WardMetaTableSchema = {
    wardMeta: wardMetaTableColumns,
};
