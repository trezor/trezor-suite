import { HANDSHAKE } from './constants/messages';
import * as RESPONSES from './constants/responses';
import type {
    ServerInfo,
    AccountInfo,
    Utxo,
    FiatRatesBySymbol,
    Transaction,
    AccountBalanceHistory,
    ChannelMessage,
} from './common';
import type { MempoolTransactionNotification, Block } from './blockbook';

// messages sent from worker to blockchain.js

export interface Connect {
    type: typeof RESPONSES.CONNECT;
    payload: boolean;
}

export interface Error {
    type: typeof RESPONSES.ERROR;
    payload: {
        code: string;
        message: string;
    };
}

export interface GetInfo {
    type: typeof RESPONSES.GET_INFO;
    payload: ServerInfo;
}

export interface GetBlockHash {
    type: typeof RESPONSES.GET_BLOCK_HASH;
    payload: string;
}

export interface GetBlock {
    type: typeof RESPONSES.GET_BLOCK;
    payload: Block;
}

export interface GetAccountInfo {
    type: typeof RESPONSES.GET_ACCOUNT_INFO;
    payload: AccountInfo;
}

export interface GetAccountUtxo {
    type: typeof RESPONSES.GET_ACCOUNT_UTXO;
    payload: Utxo[];
}

export interface GetTransaction {
    type: typeof RESPONSES.GET_TRANSACTION;
    payload: Transaction;
}

export interface GetTransactionHex {
    type: typeof RESPONSES.GET_TRANSACTION_HEX;
    payload: string;
}

export interface GetAccountBalanceHistory {
    type: typeof RESPONSES.GET_ACCOUNT_BALANCE_HISTORY;
    payload: AccountBalanceHistory[];
}

export interface GetCurrentFiatRates {
    type: typeof RESPONSES.GET_CURRENT_FIAT_RATES;
    payload: {
        ts: number;
        rates: FiatRatesBySymbol;
    };
}

export interface GetFiatRatesForTimestamps {
    type: typeof RESPONSES.GET_FIAT_RATES_FOR_TIMESTAMPS;
    payload: {
        tickers: {
            ts: number;
            rates: FiatRatesBySymbol;
        }[];
    };
}

export interface GetFiatRatesTickersList {
    type: typeof RESPONSES.GET_FIAT_RATES_TICKERS_LIST;
    payload: {
        ts: number;
        availableCurrencies: string[];
    };
}

export interface EstimateFee {
    type: typeof RESPONSES.ESTIMATE_FEE;
    payload: {
        feePerUnit: string;
        feePerTx?: string;
        feeLimit?: string;
    }[];
}

export interface RpcCall {
    type: typeof RESPONSES.RPC_CALL;
    payload: {
        data: string;
    };
}

export interface Subscribe {
    type: typeof RESPONSES.SUBSCRIBE;
    payload: { subscribed: boolean };
}

export interface Unsubscribe {
    type: typeof RESPONSES.UNSUBSCRIBE;
    payload: { subscribed: boolean };
}

export interface BlockEvent {
    type: 'block';
    payload: {
        blockHeight: number;
        blockHash: string;
    };
}

export interface MempoolEvent {
    type: 'mempool';
    payload: MempoolTransactionNotification;
}

export interface NotificationEvent {
    type: 'notification';
    payload: {
        descriptor: string;
        tx: Transaction;
    };
}

export interface FiatRatesEvent {
    type: 'fiatRates';
    payload: {
        rates: FiatRatesBySymbol;
    };
}

export interface Notification {
    type: typeof RESPONSES.NOTIFICATION;
    payload: BlockEvent | NotificationEvent | FiatRatesEvent | MempoolEvent;
}

export interface PushTransaction {
    type: typeof RESPONSES.PUSH_TRANSACTION;
    payload: string;
}

interface WithoutPayload {
    id: number;
    type: typeof HANDSHAKE | typeof RESPONSES.CONNECTED;
    payload?: typeof undefined;
}

// extended
export type Response =
    | ChannelMessage<WithoutPayload>
    | ChannelMessage<{ type: typeof RESPONSES.DISCONNECTED; payload: boolean }>
    | ChannelMessage<Error>
    | ChannelMessage<Connect>
    | ChannelMessage<GetInfo>
    | ChannelMessage<GetBlockHash>
    | ChannelMessage<GetBlock>
    | ChannelMessage<GetAccountInfo>
    | ChannelMessage<GetAccountUtxo>
    | ChannelMessage<GetTransaction>
    | ChannelMessage<GetTransactionHex>
    | ChannelMessage<GetAccountBalanceHistory>
    | ChannelMessage<GetCurrentFiatRates>
    | ChannelMessage<GetFiatRatesForTimestamps>
    | ChannelMessage<GetFiatRatesTickersList>
    | ChannelMessage<EstimateFee>
    | ChannelMessage<RpcCall>
    | ChannelMessage<Subscribe>
    | ChannelMessage<Unsubscribe>
    | ChannelMessage<Notification>
    | ChannelMessage<PushTransaction>;
