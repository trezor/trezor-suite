export const STELLAR_RPC_MAX_LEDGER_KEYS = 200;

export const STELLAR_RPC_SUBMIT_POLL_INTERVAL_MS = 1000;
export const STELLAR_RPC_SUBMIT_POLL_TIMEOUT_MS = 30_000;

export const STELLAR_RPC_SUBMIT_RETRY_ATTEMPTS = 3;
export const STELLAR_RPC_SUBMIT_RETRY_DELAY_MS = 1000;

/** Horizon enumerates every trustline; RPC can only look up assets Suite already knows. */
export type StellarTrustlineDiscovery = 'horizon' | 'rpc';

export const STELLAR_TRUSTLINE_DISCOVERY: StellarTrustlineDiscovery = 'horizon';

/** A failed RPC read degrades to Horizon rather than leaving the account unloadable. */
export type StellarRpcReadFallback = 'horizon' | 'off';

export const STELLAR_RPC_READ_FALLBACK: StellarRpcReadFallback = 'horizon';

/** RPC's `getLatestLedger` returns megabytes of close meta, Horizon the same head in bytes. */
export type StellarLedgerHeadSource = 'horizon' | 'rpc';

export const STELLAR_LEDGER_HEAD_SOURCE: StellarLedgerHeadSource = 'horizon';

/** Effects give every operation type a real amount; the operations resource decodes only four. */
export type StellarHistoryEffects = 'horizon' | 'off';

export const STELLAR_HISTORY_EFFECTS: StellarHistoryEffects = 'horizon';

export const STELLAR_HISTORY_EFFECTS_LIMIT = 200;

/** A page walks Horizon until it is full, so the walk needs a wall-clock bound of its own. */
export const STELLAR_HISTORY_PAGE_TIMEOUT_MS = 30_000;
