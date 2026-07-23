export interface AccountBalanceHistoryParams {
    descriptor: string;
    from?: number;
    to?: number;
    currencies?: string[];
    groupBy?: number;
}

export interface GetCurrentFiatRatesParams {
    currencies?: string[];
    token?: string;
}

export interface GetFiatRatesForTimestampsParams {
    timestamps: number[];
    currencies?: string[];
    token?: string;
}

export interface GetFiatRatesTickersListParams {
    timestamp?: number;
    token?: string;
}

/**
 * Wallet-declared in-flight PRIVATE (alternative send-tx / relay) transactions. Lets blockbook route
 * the nonce lookup and gas estimate deterministically from authoritative wallet state instead of
 * inferring it from its per-instance `recentSenders` heuristic (fragile across restarts and
 * load-balanced replicas). Blockbook only (EVM). See trezor/blockbook#1639.
 */
export interface PrivatePendingHint {
    nonces: number[]; // account nonces of the in-flight private txs; blockbook raises the reported pending nonce to max(nonces)+1
    txids?: string[]; // forward-compat only; not yet consumed by blockbook
}

export interface EstimateFeeParams {
    blocks?: number[];
    specific?: {
        conservative?: boolean; // btc
        txsize?: number; // btc transaction size
        from?: string; // eth from
        to?: string; // eth to
        data?: string; // eth tx data, sol tx message
        value?: string; // eth tx amount
        newAccountProgramName?: 'staking' | 'spl-token' | 'spl-token-2022'; // program name of the Solana account that is being created, default: 'spl-token'
        privatePending?: { nonces: number[] }; // eth: presence-only routing hint (see PrivatePendingHint) - routes the estimate to the relay's pending-private state
    };
}

export interface RpcCallParams {
    from: string;
    to: string;
    data: string;
}

export interface AccountInfoParams {
    descriptor: string; // address or xpub
    details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txs'; // depth, default: 'basic'
    tokens?: 'nonzero' | 'used' | 'derived'; // blockbook only, default: 'derived' - show all derived addresses, 'used' - show only used addresses, 'nonzero' - show only address with balance
    page?: number; // blockbook only, page index
    pageSize?: number; // how many transactions on page
    pageCursor?: string; // stellar only, cursor for pagination
    from?: number; // from block
    to?: number; // to block
    contractFilter?: string; // blockbook only, ethereum token filter
    gap?: number; // derived addresses gap
    // since xrpl.js cannot use pages "marker" is used as first unknown point in history (block and sequence of transaction)
    marker?: {
        ledger: number;
        seq: number;
    };
    tokenAccountsPubKeys?: string[]; // solana only, token accounts to fetch txids for
    protocols?: 'erc4626'[]; // protocols to include in the response (e.g. 'erc4626')
    confirmedNonce?: boolean; // blockbook only (EVM), additionally fetch the confirmed (mined-only) nonce
    privatePending?: PrivatePendingHint; // blockbook only (EVM), authoritatively declares in-flight private txs for deterministic nonce routing
}
