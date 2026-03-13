import type { OptionalKey, RequiredKey } from '@trezor/type-utils';

import type { BaseCurrencyCode } from './baseCurrency';
import type {
    AvailableVsCurrencies,
    BalanceHistory,
    Address as BlockbookAddress,
    Block as BlockbookBlock,
    Token as BlockbookToken,
    TokenTransfer as BlockbookTokenTransfer,
    Tx as BlockbookTx,
    Utxo as BlockbookUtxo,
    FiatTicker,
    MempoolTxidFilterEntries,
    Vin,
    Vout,
    WsAccountUtxoReq,
    WsBlockFilterReq,
    WsBlockFiltersBatchReq,
    WsBlockHashRes,
    WsEstimateFeeRes,
    WsInfoRes,
    WsMempoolFiltersReq,
} from './blockbook-api';
import type {
    AccountBalanceHistoryParams,
    AccountInfoParams,
    EstimateFeeParams,
    GetCurrentFiatRatesParams,
    GetFiatRatesForTimestampsParams,
    GetFiatRatesTickersListParams,
    RpcCallParams,
} from './params';

export type AccountUtxo = RequiredKey<BlockbookUtxo, 'address' | 'height' | 'value' | 'path'>[];

export interface Subscribe {
    subscribed: boolean;
}

export type ServerInfo = WsInfoRes;

export type BlockHash = WsBlockHashRes;

export type Block = Omit<
    RequiredKey<BlockbookBlock, 'page' | 'totalPages' | 'itemsOnPage'>,
    'txs' | 'confirmations' | 'size' | 'version' | 'merkleRoot' | 'nonce' | 'bits' | 'difficulty'
> & {
    txCount: number;
    txs: Transaction[];
};

type ScriptType = 'taproot' | 'taproot-noordinals';

export type FilterRequestParams = Omit<WsBlockFilterReq, 'scriptType' | 'blockHash'> & {
    scriptType: ScriptType;
};

export type MempoolFiltersParams = Omit<
    OptionalKey<WsMempoolFiltersReq, 'fromTimestamp'>,
    'scriptType'
> & {
    scriptType: ScriptType;
};

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
    /** @deprecated: Use standard instead. */
    type: 'ERC20';
    standard: 'ERC20';
} & Pick<BlockbookToken, 'balance' | 'baseValue' | 'secondaryValue'>;

export type ERC721 = BaseERC & {
    /** @deprecated: Use standard instead. */
    type: 'ERC721';
    standard: 'ERC721';
} & Required<Pick<BlockbookToken, 'ids'>>;

export type ERC1155 = BaseERC & {
    /** @deprecated: Use standard instead. */
    type: 'ERC1155';
    standard: 'ERC1155';
} & Required<Pick<BlockbookToken, 'multiTokenValues'>>;

export type BEP20 = BaseERC & {
    /** @deprecated: Use standard instead. */
    type: 'BEP20';
    standard: 'BEP20';
} & Pick<BlockbookToken, 'balance' | 'baseValue' | 'secondaryValue'>;

export type BEP721 = BaseERC & {
    /** @deprecated: Use standard instead. */
    type: 'BEP721';
    standard: 'BEP721';
} & Required<Pick<BlockbookToken, 'ids'>>;

export type BEP1155 = BaseERC & {
    /** @deprecated: Use standard instead. */
    type: 'BEP1155';
    standard: 'BEP1155';
} & Required<Pick<BlockbookToken, 'multiTokenValues'>>;

export type AccountInfo = Omit<
    RequiredKey<BlockbookAddress, 'totalReceived' | 'totalSent' | 'itemsOnPage' | 'totalPages'>,
    'tokens' | 'transactions'
> & {
    tokens?: (XPUBAddress | ERC20 | ERC721 | ERC1155 | BEP20 | BEP721 | BEP1155)[];
    transactions?: Transaction[];
};

export type AccountUtxoParams = WsAccountUtxoReq;

export type TokenStandard =
    | 'TRC10'
    | 'ERC20'
    | 'TRC20'
    | 'BEP20'
    | 'ERC721'
    | 'TRC721'
    | 'BEP721'
    | 'ERC1155'
    | 'TRC1155'
    | 'BEP1155'
    | 'SPL'
    | 'SPL-2022'
    | 'BLOCKFROST'
    | 'STELLAR-CLASSIC';

export type FiatRatesBySymbol = {
    [K in BaseCurrencyCode]?: number | undefined;
};

export type AccountBalanceHistory = Omit<
    OptionalKey<BalanceHistory, 'sentToSelf'>,
    'txid' | 'rates'
> & {
    rates: FiatRatesBySymbol;
};

export type VinVout = OptionalKey<Vin & Vout, 'addresses'>;

export type Transaction = Omit<RequiredKey<BlockbookTx, 'fees'>, 'tokenTransfers'> & {
    tokenTransfers?: (BlockbookTokenTransfer & {
        type: TokenStandard; // string in Tx, seems to always be ERC20 | ERC721 | ERC1155
        standard: TokenStandard;
    })[];
};

export interface Push {
    result: string;
}

export type Fee = Omit<RequiredKey<WsEstimateFeeRes, 'feePerUnit'>, 'eip1559'>[];

export type BlockNotification = Pick<BlockbookBlock, 'hash' | 'height'>;

export type MempoolTransactionNotification = RequiredKey<
    Transaction,
    'confirmationETASeconds' | 'confirmationETABlocks'
>;

export interface AddressNotification {
    address: string;
    tx: Transaction;
}

export interface FiatRatesNotification {
    rates: FiatRatesBySymbol;
}

export type TimestampedFiatRates = Omit<RequiredKey<FiatTicker, 'ts'>, 'error' | 'rates'> & {
    rates: FiatRatesBySymbol;
};

export interface FiatRatesForTimestamp {
    tickers: TimestampedFiatRates[];
}

export type AvailableCurrencies = Omit<RequiredKey<AvailableVsCurrencies, 'ts'>, 'error'>;

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
declare function FSend(
    method: 'sendTransaction',
    params: { hex: string; disableAlternativeRPC?: boolean },
): Promise<Push>;
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
