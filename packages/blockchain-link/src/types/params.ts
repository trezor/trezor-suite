export interface AccountBalanceHistoryParams {
    descriptor: string;
    from: number;
    to: number;
    currencies?: string[];
    groupBy?: number;
}

export interface GetCurrentFiatRatesParams {
    currencies?: string[];
}

export interface GetFiatRatesForTimestampsParams {
    timestamps: number[];
    currencies?: string[];
}

export interface GetFiatRatesTickersListParams {
    timestamp?: number;
}

export interface EstimateFeeParams {
    blocks?: number[];
    specific?: {
        conservative?: boolean; // btc
        txsize?: number; // btc transaction size
        from?: string; // eth from
        to?: string; // eth to
        data?: string; // eth tx data
        value?: string; // eth tx amount
    };
}

export interface AccountInfoParams {
    descriptor: string; // address or xpub
    details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txs'; // depth, default: 'basic'
    tokens?: 'nonzero' | 'used' | 'derived'; // blockbook only, default: 'derived' - show all derived addresses, 'used' - show only used addresses, 'nonzero' - show only address with balance
    page?: number; // blockbook only, page index
    pageSize?: number; // how many transactions on page
    from?: number; // from block
    to?: number; // to block
    contractFilter?: string; // blockbook only, ethereum token filter
    gap?: number; // blockbook only, derived addresses gap
    // since ripple-lib cannot use pages "marker" is used as first unknown point in history (block and sequence of transaction)
    marker?: {
        ledger: number;
        seq: number;
    };
}
