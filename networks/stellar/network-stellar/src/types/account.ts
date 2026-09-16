/** Identifies a classic asset, i.e. the `CODE-ISSUER` pair Suite uses as a token contract. */
export interface StellarAssetRef {
    assetCode: string;
    assetIssuer: string;
}

export interface StellarTrustline extends StellarAssetRef {
    /** Base units (stroops). */
    balance: string;
}

/** Account state as Suite needs it, from either source; every amount in stroops. */
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
