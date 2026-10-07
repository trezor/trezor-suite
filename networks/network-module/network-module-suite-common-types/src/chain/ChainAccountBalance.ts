/** Native balance of a chain account, in whole units of the network's coin. */
export type ChainAccountBalance = {
    readonly balance: string;
    readonly availableBalance: string;

    /** The balance the network shows to the user and values in fiat. */
    readonly displayBalance: string;
    readonly empty: boolean;
};
