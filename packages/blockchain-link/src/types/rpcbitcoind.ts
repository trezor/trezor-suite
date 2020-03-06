export interface Subscribe {
    subscribed: boolean;
}

export interface BlockchainInfo {
    bestHash: string;
    blocks: number;
    bestblockhash: string;
    decimals: number;
    name: string;
    shortcut: string;
    chain: string;
}

export interface NetworkInfo {
    version: string;
}

export interface BlockHash {
    hash: string;
}

export interface AccountInfoParams {
    descriptor: string;
    details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txs';
    tokens?: 'nonzero' | 'used' | 'derived';
    page?: number;
    pageSize?: number;
    from?: number;
    to?: number;
    contractFilter?: string;
    gap?: number;
}

export interface XPUBAddress {
    type: 'XPUBAddress';
    name: string;
    path: string;
    transfers: number;
    balance: string;
    totalSent: string;
    totalReceived: string;
}

export interface ERC20 {
    type: 'ERC20';
    name?: string;
    symbol?: string;
    contract: string;
    balance?: string;
    decimals?: number;
}

export interface AccountInfo {
    address: string;
    balance: string;
    totalReceived: string;
    totalSent: string;
    txs: number;
    unconfirmedBalance: string;
    unconfirmedTxs: number;
    page?: number;
    itemsOnPage: number;
    totalPages: number;
    nonTokenTxs?: number;
    transactions?: Transaction[];
    nonce?: string;
    tokens?: (XPUBAddress | ERC20)[];
}

export interface AccountUtxoParams {
    descriptor: string;
}

export type AccountUtxo = {
    txid: string;
    vout: number;
    value: string;
    height: number;
    address: string;
    path: string;
    confirmations: number;
    coinbase?: boolean;
}[];

export interface VinVout {
    n: number;
    addresses?: string[];
    isAddress: boolean;
    value?: string;
    coinbase?: string;
    txid?: string;
    vout?: number;
    sequence?: number;
    hex?: string;
}

export interface Transaction {
    txid: string;
    version?: number;
    vin: VinVout[];
    vout: VinVout[];
    blockHeight: number;
    blockHash?: string;
    confirmations: number;
    blockTime: number;
    value: string;
    valueIn: string;
    fees: string;
    hex: string;
    ethereumSpecific?: {
        status: number;
        nonce: number;
        gasLimit: number;
        gasUsed?: number;
        gasPrice: string;
    };
    tokenTransfers?: {
        from?: string;
        to?: string;
        value: string;
        token: string;
        name: string;
        symbol: string;
        decimals?: number;
    }[];
}

export interface Push {
    result: string;
}

export interface EstimateFeeParams {
    blocks?: number[];
    specific?: {
        conservative?: boolean; // btc
        txsize?: number; // btc transaction size
        from?: string; // eth from
        to?: string; // eth to
        data?: string; // eth tx data
    };
}

export type Fee = {
    feePerUnit: string;
    feePerTx?: string;
    feeLimit?: string;
}[];

export interface BlockNotification {
    height: number;
    hash: string;
}

export interface AddressNotification {
    address: string;
    tx: Transaction;
}

declare function FSend(method: 'getInfo', params: {}): Promise<BlockchainInfo>;
declare function FSend(method: 'getBlockHash', params: { height: number }): Promise<BlockHash>;
declare function FSend(method: 'getAccountInfo', params: AccountInfoParams): Promise<AccountInfo>;
declare function FSend(method: 'getAccountUtxo', params: AccountUtxoParams): Promise<AccountUtxo>;
declare function FSend(method: 'getTransaction', params: { txid: string }): Promise<Transaction>;
declare function FSend(method: 'sendTransaction', params: { hex: string }): Promise<Push>;
declare function FSend(method: 'estimateFee', params: EstimateFeeParams): Promise<Fee>;
declare function FSend(
    method: 'subscribeAddresses',
    params: { addresses: string[] }
): Promise<Subscribe>;
declare function FSend(method: 'unsubscribeAddresses', params: {}): Promise<Subscribe>;
declare function FSend(method: 'subscribeNewBlock', params: {}): Promise<Subscribe>;
declare function FSend(method: 'unsubscribeNewBlock', params: {}): Promise<Subscribe>;
export type Send = typeof FSend;
