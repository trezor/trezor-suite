/** What a transaction did; kinds that read the same to a holder share one label. */
export type StellarOperationType =
    | 'accountMerge'
    | 'allowTrust'
    | 'bumpSequence'
    | 'changeTrust'
    | 'claimClaimableBalance'
    | 'clawback'
    | 'createAccount'
    | 'createClaimableBalance'
    | 'footprint'
    | 'inflation'
    | 'invokeHostFunction'
    | 'liquidityPool'
    | 'manageData'
    | 'offer'
    | 'pathPayment'
    | 'payment'
    | 'setOptions'
    | 'sponsorship'
    | 'trustLineFlags';

export type StellarClaimableBalanceOffer = {
    /** The account is only a claimant: the value arrives when it claims, not now. */
    isClaimant: boolean;
    offeredAmount: string;
};
