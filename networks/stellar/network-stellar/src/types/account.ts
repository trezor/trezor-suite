/** Identifies a classic asset, i.e. the `CODE-ISSUER` pair Suite uses as a token contract. */
export interface StellarAssetRef {
    assetCode: string;
    assetIssuer: string;
}

export interface StellarTrustline extends StellarAssetRef {
    /** Base units (stroops). */
    balance: string;
}

/**
 * Account state as Suite needs it, whether read from Horizon or Stellar RPC. All amounts are base
 * units (stroops) — RPC reports them that way, avoiding the float round-trip Horizon's decimal
 * lumen strings require.
 */
export interface StellarAccountState {
    /** `false` when the account does not exist on the ledger yet. */
    exists: boolean;
    balance: string;
    sequence: string;
    numSubEntries: number;
    numSponsoring: number;
    numSponsored: number;
    sellingLiabilities: string;
    trustlines: StellarTrustline[];
}
