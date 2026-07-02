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
    // Monero only: the private view key + restore height needed for client-side scanning.
    // This is a secret travelling in-process (connect core -> worker) and must NEVER be
    // echoed back into the AccountInfo response, logged, or persisted (CLAUDE.md confidential data).
    monero?: {
        // Required to build a fresh scanning wallet. Omitted for a reset (resetScan), where the worker
        // recovers the view key from the existing wallet — so the device isn't prompted again.
        privateViewKey?: string;
        restoreHeight?: number;
        // Wallet "birthday" — the worker resolves it to a block height via the daemon
        // (getHeightByDate) and scans from there instead of the genesis block. month is 1-12.
        restoreDate?: { year: number; month: number };
        // Send flow: also return the wallet's raw spendable outputs (misc.moneroOutputs). Opt-in
        // because gathering them queries the wallet for every owned output; the periodic balance/tx
        // refresh does not need them.
        gatherOutputs?: boolean;
        // With gatherOutputs, return ALL owned outputs (spent + unspent + locked) in the wallet's
        // transfer order, not just the spendable subset. Used by the key-image-sync (import) flow,
        // which must feed the device every owned output positionally (wallet2 m_transfers order).
        allOutputs?: boolean;
        // Key-image-sync (import) flow: device-computed key images (one per owned output, in transfer
        // order) to import into the scanning wallet so it learns which outputs were spent. This is
        // what lets a view-only wallet show outgoing/self transactions and a correct balance.
        importKeyImages?: { keyImage: string; signature: string }[];
        // Interrupt the current scan and rebuild the wallet from `restoreDate` (the user picked a new
        // birthday). The existing wallet + its on-disk cache are discarded.
        resetScan?: boolean;
    };
}
