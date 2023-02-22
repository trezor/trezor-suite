import type {
    AccountBalanceHistoryParams,
    GetCurrentFiatRatesParams,
    GetFiatRatesForTimestampsParams,
    GetFiatRatesTickersListParams,
    EstimateFeeParams,
    AccountInfoParams,
} from './params';
import type { AccountBalanceHistory, FiatRates } from './common';
import {
    Address,
    Token,
    Tx,
    Vin,
    Vout,
    WsAccountUtxoReq,
    WsBlockHashReq,
    WsEstimateFeeRes,
    WsSendTransactionReq,
    WsSubscribeAddressesReq,
    WsSubscribeFiatRatesReq,
    WsTransactionReq,
} from './blockbook-api';

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
    backend?: {
        subversion: string;
        version: string;
        consensus?: {
            chaintip: string;
            nextblock: string;
        };
    };
}

export interface BlockHash {
    hash: string;
}

// export interface XPUBAddress {
//     type: 'XPUBAddress';
//     name: string;
//     path: string;
//     transfers: number;
//     balance: string;
//     totalSent: string;
//     totalReceived: string;
// }

export type XPUBAddress = Required<
    Pick<Token, 'name' | 'path' | 'transfers' | 'balance' | 'totalSent' | 'totalReceived'>
> & { type: 'XPUBAddress' };

export type EVMToken = Pick<Token, 'name' | 'symbol' | 'decimals' | 'transfers'> & {
    contract: string;
};

export type ERC20 = EVMToken &
    Pick<Token, 'balance' | 'baseValue' | 'secondaryValue'> & { type: 'ERC20' };

export type ERC721 = EVMToken & Pick<Token, 'ids'> & { type: 'ERC721' };

export type ERC1155 = EVMToken & Pick<Token, 'multiTokenValues'> & { type: 'ERC1155' };

// export interface AccountInfo {
//     address: string;
//     balance: string;
//     totalReceived: string;
//     totalSent: string;
//     txs: number;
//     unconfirmedBalance: string;
//     unconfirmedTxs: number;
//     page?: number;
//     itemsOnPage: number;
//     totalPages: number;
//     nonTokenTxs?: number;
//     transactions?: Transaction[];
//     nonce?: string;
//     tokens?: (XPUBAddress | ERC20)[];
//     erc20Contract?: ERC20;
// }

export type AccountInfo = Address & {
    tokens?: (XPUBAddress | ERC20 | ERC721 | ERC1155)[];
    erc20Contract?: ERC20;
};

// export interface AccountUtxoParams {
//     descriptor: string;
// }

export type AccountUtxoParams = WsAccountUtxoReq;

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

// export interface VinVout {
//     n: number;
//     addresses?: string[];
//     isAddress: boolean;
//     value?: string;
//     coinbase?: string;
//     txid?: string;
//     vout?: number;
//     sequence?: number;
//     hex?: string;
// }

export type VinVout = Vin | Vout;

// export interface Transaction {
//     txid: string;
//     version?: number;
//     vin: VinVout[];
//     vout: VinVout[];
//     blockHeight: number;
//     blockHash?: string;
//     confirmations: number;
//     blockTime: number;
//     value: string;
//     valueIn: string;
//     fees: string;
//     hex: string;
//     lockTime?: number;
//     vsize?: number;
//     size?: number;
//     ethereumSpecific?: {
//         status: number;
//         nonce: number;
//         data?: string;
//         gasLimit: number;
//         gasUsed?: number;
//         gasPrice: string;
//     };
//     tokenTransfers?: {
//         from?: string;
//         to?: string;
//         value: string;
//         token: string;
//         name: string;
//         symbol: string;
//         decimals?: number;
//     }[];
// }

export type Transaction = Tx;

export interface Push {
    result: string;
}

// export type Fee = {
//     feePerUnit: string;
//     feePerTx?: string;
//     feeLimit?: string;
// }[];

export type Fee = WsEstimateFeeRes[];

export interface BlockNotification {
    height: number;
    hash: string;
}

export interface MempoolTransactionNotification extends Transaction {
    confirmationETABlocks: number;
    confirmationETASeconds: number;
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

export interface AvailableCurrencies {
    ts: number;
    available_currencies: string[];
}

declare function FSend(method: 'getInfo'): Promise<ServerInfo>;
declare function FSend(method: 'getBlockHash', params: WsBlockHashReq): Promise<BlockHash>;
declare function FSend(method: 'getAccountInfo', params: AccountInfoParams): Promise<AccountInfo>;
declare function FSend(method: 'getAccountUtxo', params: AccountUtxoParams): Promise<AccountUtxo>;
declare function FSend(method: 'getTransaction', params: WsTransactionReq): Promise<Transaction>;
declare function FSend(method: 'sendTransaction', params: WsSendTransactionReq): Promise<Push>;
declare function FSend(
    method: 'getBalanceHistory',
    params: AccountBalanceHistoryParams,
): Promise<AccountBalanceHistory[]>;
declare function FSend(
    method: 'getCurrentFiatRates',
    params: GetCurrentFiatRatesParams,
): Promise<TimestampedFiatRates>;
declare function FSend(
    method: 'getFiatRatesTickersList',
    params: GetFiatRatesTickersListParams,
): Promise<AvailableCurrencies>;
declare function FSend(
    method: 'getFiatRatesForTimestamps',
    params: GetFiatRatesForTimestampsParams,
): Promise<FiatRatesForTimestamp>;
declare function FSend(method: 'estimateFee', params: EstimateFeeParams): Promise<Fee>;
declare function FSend(
    method: 'subscribeAddresses',
    params: WsSubscribeAddressesReq,
): Promise<Subscribe>;
declare function FSend(method: 'unsubscribeAddresses'): Promise<Subscribe>;
declare function FSend(method: 'subscribeNewBlock'): Promise<Subscribe>;
declare function FSend(method: 'unsubscribeNewBlock'): Promise<Subscribe>;
declare function FSend(
    method: 'subscribeFiatRates',
    params: WsSubscribeFiatRatesReq,
): Promise<Subscribe>;
declare function FSend(method: 'unsubscribeFiatRates'): Promise<Subscribe>;
declare function FSend(method: 'subscribeNewTransaction'): Promise<Subscribe>;
declare function FSend(method: 'unsubscribeNewTransaction'): Promise<Subscribe>;
export type Send = typeof FSend;
