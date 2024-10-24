import type { RequiredKey } from '@trezor/type-utils';

import type {
    AccountBalanceHistoryParams,
    GetCurrentFiatRatesParams,
    GetFiatRatesForTimestampsParams,
    GetFiatRatesTickersListParams,
    EstimateFeeParams,
    RpcCallParams,
    AccountInfoParams,
} from './params';
import type { AccountBalanceHistory, FiatRatesBySymbol, TokenStandard } from './common';
import type {
    Tx as BlockbookTx,
    Vin,
    Vout,
    Utxo as BlockbookUtxo,
    WsInfoRes,
    WsBlockHashRes,
    WsBlockFilterReq,
    WsBlockFiltersBatchReq,
    MempoolTxidFilterEntries,
    Token as BlockbookToken,
    TokenTransfer as BlockbookTokenTransfer,
    AddressAlias,
    ContractInfo,
    StakingPool,
} from './blockbook-api';

type OptionalKey<M, K extends keyof M> = Omit<M, K> & Partial<Pick<M, K>>;

export type AccountUtxo = RequiredKey<BlockbookUtxo, 'address' | 'height' | 'value' | 'path'>[];

export interface Subscribe {
    subscribed: boolean;
}

export type ServerInfo = WsInfoRes;

export type BlockHash = WsBlockHashRes;

export interface Block {
    page: number;
    totalPages: number;
    itemsOnPage: number;
    hash: string;
    height: number;
    txCount: number;
    txs: Transaction[];
}

export interface FilterRequestParams {
    scriptType: 'taproot' | 'taproot-noordinals';
    M?: number;
}

export interface MempoolFiltersParams extends FilterRequestParams {
    fromTimestamp?: number;
}

export interface FilterResponse {
    P: number;
    M: number;
    zeroedKey: boolean;
}

type BlockFiltersBatch = `${string}:${string}:${string}`[];

// XPUBAddress, ERC20, ERC721, ERC1155 - blockbook generated type (Token) is not strict enough
export type XPUBAddress = {
    type: 'XPUBAddress';
} & Required<
    Pick<BlockbookToken, 'path' | 'decimals' | 'balance' | 'totalSent' | 'totalReceived'>
> &
    Pick<BlockbookToken, 'name' | 'transfers'>;

type BaseERC = Required<Pick<BlockbookToken, 'contract'>> &
    Partial<Pick<BlockbookToken, 'transfers'>> & // transfers is optional
    Pick<BlockbookToken, 'name' | 'symbol' | 'decimals'>;

export type ERC20 = BaseERC & {
    type: 'ERC20';
} & Pick<BlockbookToken, 'balance' | 'baseValue' | 'secondaryValue'>;

export type ERC721 = BaseERC & {
    type: 'ERC721';
} & Required<Pick<BlockbookToken, 'ids'>>;

export type ERC1155 = BaseERC & {
    type: 'ERC1155';
} & Required<Pick<BlockbookToken, 'multiTokenValues'>>;

export interface AccountInfo {
    address: string;
    balance: string;
    totalReceived: string;
    totalSent: string;
    txs: number;
    addrTxCount?: number;
    unconfirmedBalance: string;
    unconfirmedTxs: number;
    page?: number;
    itemsOnPage: number;
    totalPages: number;
    nonTokenTxs?: number;
    transactions?: Transaction[];
    nonce?: string;
    tokens?: (XPUBAddress | ERC20 | ERC721 | ERC1155)[];
    contractInfo?: ContractInfo;
    addressAliases?: { [key: string]: AddressAlias };
    stakingPools?: StakingPool[];
}

export interface AccountUtxoParams {
    descriptor: string;
}

export type VinVout = OptionalKey<Vin & Vout, 'addresses'>;

export interface EthereumInternalTransfer {
    type: number;
    from: string;
    to: string;
    value?: string;
}

export interface Transaction extends BlockbookTx {
    fees: string; // optional in Tx, seems to always be there
    tokenTransfers?: (BlockbookTokenTransfer & {
        type: TokenStandard; // string in Tx, seems to always be ERC20 | ERC721 | ERC1155
    })[];
}

export interface Push {
    result: string;
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

export interface MempoolTransactionNotification extends Transaction {
    confirmationETABlocks: number;
    confirmationETASeconds: number;
}

export interface AddressNotification {
    address: string;
    tx: Transaction;
}

export interface FiatRatesNotification {
    rates: FiatRatesBySymbol;
}

export interface TimestampedFiatRates {
    ts: number;
    rates: FiatRatesBySymbol;
}

export interface FiatRatesForTimestamp {
    tickers: TimestampedFiatRates[];
}

export interface AvailableCurrencies {
    ts: number;
    available_currencies: string[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare function FSend(method: 'getInfo'): Promise<ServerInfo>;
declare function FSend(method: 'getBlockHash', params: { height: number }): Promise<BlockHash>;
declare function FSend(method: 'getBlock', params: { id: string }): Promise<Block>;
declare function FSend(
    method: 'getBlockFilter',
    params: WsBlockFilterReq & FilterRequestParams,
): Promise<FilterResponse & { blockFilter: string }>;
declare function FSend(
    method: 'getBlockFiltersBatch',
    params: WsBlockFiltersBatchReq & FilterRequestParams,
): Promise<FilterResponse & { blockFiltersBatch: BlockFiltersBatch }>;
declare function FSend(
    method: 'getMempoolFilters',
    params: MempoolFiltersParams,
): Promise<FilterResponse & MempoolTxidFilterEntries>;
declare function FSend(method: 'getAccountInfo', params: AccountInfoParams): Promise<AccountInfo>;
declare function FSend(method: 'getAccountUtxo', params: AccountUtxoParams): Promise<AccountUtxo>;
declare function FSend(method: 'getTransaction', params: { txid: string }): Promise<Transaction>;
declare function FSend(method: 'sendTransaction', params: { hex: string }): Promise<Push>;
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
declare function FSend(method: 'rpcCall', params: RpcCallParams): Promise<{ data: string }>;
declare function FSend(
    method: 'subscribeAddresses',
    params: { addresses: string[] },
): Promise<Subscribe>;
declare function FSend(method: 'unsubscribeAddresses'): Promise<Subscribe>;
declare function FSend(method: 'subscribeNewBlock'): Promise<Subscribe>;
declare function FSend(method: 'unsubscribeNewBlock'): Promise<Subscribe>;
declare function FSend(
    method: 'subscribeFiatRates',
    params: { currency?: string },
): Promise<Subscribe>;
declare function FSend(method: 'unsubscribeFiatRates'): Promise<Subscribe>;
declare function FSend(method: 'subscribeNewTransaction'): Promise<Subscribe>;
declare function FSend(method: 'unsubscribeNewTransaction'): Promise<Subscribe>;
export type Send = typeof FSend;
