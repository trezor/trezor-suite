import {
    AccountBalanceHistoryParams,
    GetCurrentFiatRatesParams,
    GetFiatRatesForTimestampsParams,
    GetFiatRatesTickersListParams,
    EstimateFeeParams,
    AccountInfoParams,
} from './params';

export interface Subscribe {
    subscribed: boolean;
}

export interface ServerInfo {
    bestHash: string;
    bestHeight: number;
    block0Hash: string;
    decimals: number;
    name: string;
    shortcut: string;
    testnet: boolean;
    version: string;
}

export interface BlockHash {
    hash: string;
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
    erc20Contract?: ERC20;
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
    lockTime?: number;
    ethereumSpecific?: {
        status: number;
        nonce: number;
        data?: string;
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

export type Fee = {
    feePerUnit: string;
    feePerTx?: string;
    feeLimit?: string;
}[];

export interface FiatRates {
    [symbol: string]: number | undefined;
}

export interface BlockNotification {
    height: number;
    hash: string;
}

export interface AddressNotification {
    address: string;
    tx: Transaction;
}

export interface FiatRatesNotification {
    rates: FiatRates;
}

export interface TimestampedFiatRates {
    ts: number;
    rates: FiatRates;
}

export interface FiatRatesForTimestamp {
    tickers: TimestampedFiatRates[];
}

export interface AccountBalanceHistory {
    time: number;
    txs: number;
    received: string;
    sent: string;
    sentToSelf?: string; // should always be there for blockbook >= 0.3.3
    rates: FiatRates;
}

export interface AvailableCurrencies {
    ts: number;
    // eslint-disable-next-line camelcase
    available_currencies: string[];
}

declare function FSend(method: 'getInfo'): Promise<ServerInfo>;
declare function FSend(method: 'getBlockHash', params: { height: number }): Promise<BlockHash>;
declare function FSend(method: 'getAccountInfo', params: AccountInfoParams): Promise<AccountInfo>;
declare function FSend(method: 'getAccountUtxo', params: AccountUtxoParams): Promise<AccountUtxo>;
declare function FSend(method: 'getTransaction', params: { txid: string }): Promise<Transaction>;
declare function FSend(method: 'sendTransaction', params: { hex: string }): Promise<Push>;
declare function FSend(
    method: 'getBalanceHistory',
    params: AccountBalanceHistoryParams
): Promise<AccountBalanceHistory[]>;
declare function FSend(
    method: 'getCurrentFiatRates',
    params: GetCurrentFiatRatesParams
): Promise<TimestampedFiatRates>;
declare function FSend(
    method: 'getFiatRatesTickersList',
    params: GetFiatRatesTickersListParams
): Promise<AvailableCurrencies>;
declare function FSend(
    method: 'getFiatRatesForTimestamps',
    params: GetFiatRatesForTimestampsParams
): Promise<FiatRatesForTimestamp>;
declare function FSend(method: 'estimateFee', params: EstimateFeeParams): Promise<Fee>;
declare function FSend(
    method: 'subscribeAddresses',
    params: { addresses: string[] }
): Promise<Subscribe>;
declare function FSend(method: 'unsubscribeAddresses'): Promise<Subscribe>;
declare function FSend(method: 'subscribeNewBlock'): Promise<Subscribe>;
declare function FSend(method: 'unsubscribeNewBlock'): Promise<Subscribe>;
declare function FSend(
    method: 'subscribeFiatRates',
    params: { currency?: string }
): Promise<Subscribe>;
declare function FSend(method: 'unsubscribeFiatRates'): Promise<Subscribe>;
export type Send = typeof FSend;
