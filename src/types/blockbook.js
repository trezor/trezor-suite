/* @flow */

export type Subscribe = {
    subscribed: boolean,
};

export type ServerInfo = {
    bestHash: string,
    bestHeight: number,
    block0Hash: string,
    decimals: number,
    name: string,
    shortcut: string,
    testnet: boolean,
    version: string,
};

export type AccountInfoParams = {
    descriptor: string,
    details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txs',
    tokens?: 'nonzero' | 'used' | 'derived',
    page?: number,
    pageSize?: number,
    from?: number,
    to?: number,
    contractFilter?: string,
    gap?: number,
};

export type XPUBAddress = {
    type: 'XPUBAddress',
    name: string,
    path: string,
    transfers: number,
    balance: string,
    totalSent: string,
    totalReceived: string,
};

export type ERC20 = {
    type: 'ERC20',
    name: string,
    symbol: string,
    contract: string,
    balance: string,
    decimals?: number,
};

export type AccountInfo = {
    address: string,
    balance: string,
    totalReceived: string,
    totalSent: string,
    txs: number,
    unconfirmedBalance: string,
    unconfirmedTxs: number,
    page?: number,
    itemsOnPage: number,
    totalPages: number,
    tokens?: any,
    nonTokenTxs?: number,
    transactions?: Array<Transaction>,
    nonce?: string,
    tokens?: Array<XPUBAddress | ERC20>,
};

export type AccountUtxoParams = {
    descriptor: string,
};

export type AccountUtxo = Array<{
    txid: string,
    vout: number,
    value: string,
    height: number,
    address: string,
    path: string,
    confirmations: number,
}>;

export type VinVout = {
    n: number,
    addresses?: Array<string>,
    isAddress: boolean,
    value?: string,
    coinbase?: string,
    txid?: string,
    vout?: number,
    sequence?: number,
    hex?: string,
};

export type Transaction = {
    txid: string,
    version?: number,
    vin: VinVout[],
    vout: VinVout[],
    blockHeight: number,
    blockHash?: string,
    confirmations: number,
    blockTime: number,
    value: string,
    valueIn: string,
    fees: string,
    hex: string,
    ethereumSpecific?: {
        status: number,
        nonce: number,
        gasLimit: number,
        gasUsed?: number,
        gasPrice: string,
    },
    tokenTransfers?: {
        from?: string,
        to?: string,
        value: string,
        token: string,
        name: string,
        symbol: string,
        decimals?: number,
    }[],
};

export type Push = {
    status: boolean,
};

export type EstimateFeeParams = {
    blocks: Array<number>,
    specific?: {
        conservative?: boolean,
        txsize?: number,
        from?: string,
        to?: string,
        data?: string,
    },
};

export type Fee = Array<{
    feePerUnit: string,
    feePerTx?: string,
    feeLimit?: string,
}>;

export type BlockNotification = {
    height: number,
    hash: string,
};

export type AddressNotification = {
    address: string,
    tx: Transaction,
};

/* eslint-disable no-redeclare */
declare function FSend(method: 'getInfo', params: {}): Promise<ServerInfo>;
declare function FSend(method: 'getAccountInfo', params: AccountInfoParams): Promise<AccountInfo>;
declare function FSend(method: 'getAccountUtxo', params: AccountUtxoParams): Promise<AccountUtxo>;
declare function FSend(method: 'getTransaction', params: { txid: string }): Promise<Transaction>;
declare function FSend(method: 'sendTransaction', params: { hex: string }): Promise<Push>;
declare function FSend(method: 'estimateFee', params: EstimateFeeParams): Promise<Fee>;
declare function FSend(
    method: 'subscribeAddresses',
    params: { addresses: Array<string> }
): Promise<Subscribe>;
declare function FSend(method: 'unsubscribeAddresses', params: {}): Promise<Subscribe>;
declare function FSend(method: 'subscribeNewBlock', params: {}): Promise<Subscribe>;
declare function FSend(method: 'unsubscribeNewBlock', params: {}): Promise<Subscribe>;
export type Send = typeof FSend;
