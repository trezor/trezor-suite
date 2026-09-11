/** Identifies a classic asset, i.e. the `CODE-ISSUER` pair Suite uses as a token contract. */
export interface StellarAssetRef {
    assetCode: string;
    assetIssuer: string;
}

/** A classic (trustline) asset holding, backend-neutral. */
export interface StellarTrustline extends StellarAssetRef {
    /** Base units (stroops). */
    balance: string;
}

/**
 * Account state as Suite needs it, independent of whether it was read from Horizon or from
 * Stellar RPC. All amounts are base units (stroops) — RPC reports them that way natively,
 * which avoids the float round-trip Horizon's decimal lumen strings require.
 */
export interface StellarAccountState {
    /** `false` when the account does not exist on the ledger yet. */
    exists: boolean;
    /** Native XLM balance, in stroops. */
    balance: string;
    sequence: string;
    numSubEntries: number;
    numSponsoring: number;
    numSponsored: number;
    /** Native selling liabilities, in stroops. */
    sellingLiabilities: string;
    trustlines: StellarTrustline[];
}
