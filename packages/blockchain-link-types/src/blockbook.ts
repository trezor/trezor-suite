import type {
    AccountBalanceHistoryParams,
    GetCurrentFiatRatesParams,
    GetFiatRatesForTimestampsParams,
    GetFiatRatesTickersListParams,
    EstimateFeeParams,
    AccountInfoParams,
} from './params';
import type { AccountBalanceHistory, FiatRates, TokenStandard } from './common';
import type {
    Vin,
    Vout,
    Utxo as BlockbookUtxo,
    WsInfoRes,
    WsBlockHashRes,
    Token as BlockbookToken,
    EthereumParsedInputData as BlockbookEthereumParsedInputData,
    EthereumSpecific as BlockbookEthereumSpecific,
    TokenTransfer as BlockbookTokenTransfer,
    AddressAlias,
} from './blockbook-api';

type OptionalKey<M, K extends keyof M> = Omit<M, K> & Partial<Pick<M, K>>;
type RequiredKey<M, K extends keyof M> = Omit<M, K> & Required<Pick<M, K>>;

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

export interface MempoolFiltersParams {
    scriptType: 'taproot';
    fromTimestamp?: number;
}

export interface MempoolFilters {
    entries?: { [txid: string]: string };
}

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
    erc20Contract?: ERC20;
}

export interface AccountUtxoParams {
    descriptor: string;
}

export type VinVout = OptionalKey<Vin & Vout, 'addresses'>;

type EthereumParsedData = BlockbookEthereumParsedInputData &
    Partial<Pick<BlockbookEthereumParsedInputData, 'name'>>;

export interface EthereumInternalTransfer {
    type: number;
    from: string;
    to: string;
    value?: string;
}

type EthereumSpecific = BlockbookEthereumSpecific & {
    parsedData?: EthereumParsedData;
};

type TokenTransfer = BlockbookTokenTransfer & {
    type: TokenStandard;
};

export interface Transaction {
    txid: string;
    version?: number;
    vin: VinVout[];
    vout: VinVout[];
    blockHeight: number;
    blockHash?: string;
    confirmations: number;
    blockTime: number;
    value: string; // optional
    valueIn: string; // optional
    fees: string; // optional
    hex?: string;
    lockTime?: number;
    vsize?: number;
    size?: number;
    ethereumSpecific?: EthereumSpecific;
    tokenTransfers?: TokenTransfer[];
    confirmationETABlocks?: number;
    confirmationETASeconds?: number;
    rbf?: boolean;
    coinSpecificData?: any;
    addressAliases?: { [key: string]: AddressAlias };
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
declare function FSend(method: 'getBlockHash', params: { height: number }): Promise<BlockHash>;
declare function FSend(method: 'getBlock', params: { id: string }): Promise<Block>;
declare function FSend(
    method: 'getMempoolFilters',
    params: MempoolFiltersParams,
): Promise<MempoolFilters>;
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
