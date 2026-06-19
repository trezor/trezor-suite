// EIP-1193 + EIP-6963 provider types, RPC routing types, and dApp catalog types.
// Pure, platform-agnostic and React-free — safe to import from the desktop preload.

/**
 * Blockchain namespace, CAIP-2 style. The PoC ships `eip155` (EVM) only; the
 * remaining members exist so the catalog, router and provider stay
 * namespace-keyed and a future Tron/Solana provider is purely additive (§11).
 */
export type Namespace = 'eip155' | 'tron' | 'solana' | 'cardano' | 'bip122';

/**
 * Router lane a JSON-RPC method is dispatched to (§7):
 * - `device` — requires on-device confirmation via TrezorConnect (Invariant 0)
 * - `state`  — answered from Suite redux state (accounts, selected chain)
 * - `node`   — forwarded to a read-only JSON-RPC endpoint
 * - `deny`   — rejected (unsupported/unsafe) with an EIP-1193 error
 */
export type RpcLane = 'device' | 'state' | 'node' | 'deny';

/** A single EIP-1193 `request({ method, params })` payload. */
export type Eip1193Request = {
    method: string;
    params?: unknown;
};

/** Trust tier driving the third-party consent flow (§6). */
export type TrustTier = 'general' | 'trezor-connect';

/** A curated catalog entry — one openable dApp. */
export type DappCatalogEntry = {
    id: string;
    name: string;
    /** Exact allow-listed https origin, e.g. 'https://revoke.cash'. */
    origin: string;
    /** Landing URL to load. */
    url: string;
    /** Bundled/cached locally — never hot-loaded from the dApp. */
    iconUrl: string;
    /** Shown in the title tooltip and the consent prompt. */
    description: string;
    /** ['eip155'] now; ['tron'] | ['solana'] | … later (§11). */
    namespaces: Namespace[];
    /** Supported EVM chainIds (indicative). */
    chains: number[];
    /** 'general' ⇒ show the consent interstitial before opening (§6). */
    trustTier: TrustTier;
};

/**
 * Ephemeral, in-memory session grant created on auto-connect (§4, §8).
 * Grants visibility only (selected address + chainId) — never signing.
 * Cleared on close/restart; never persisted.
 */
export type EphemeralGrant = {
    origin: string;
    address: string;
    chainId: number;
    /** Whether the user acknowledged the consent interstitial this session. */
    consentAcknowledged: boolean;
};

/** EIP-6963 provider metadata announced to the dApp. */
export type Eip6963ProviderInfo = {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
};
