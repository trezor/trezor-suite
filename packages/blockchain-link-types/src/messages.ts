import * as MESSAGES from './constants/messages';
import type { SubscriptionAccountInfo, BlockchainSettings, ChannelMessage } from './common';
import type {
    AccountBalanceHistoryParams,
    GetCurrentFiatRatesParams,
    GetFiatRatesForTimestampsParams,
    GetFiatRatesTickersListParams,
    EstimateFeeParams,
    RpcCallParams,
    AccountInfoParams,
} from './params';

// messages sent from blockchain.js to worker

export interface Connect {
    type: typeof MESSAGES.CONNECT;
}
export interface Disconnect {
    type: typeof MESSAGES.DISCONNECT;
}

export interface GetInfo {
    type: typeof MESSAGES.GET_INFO;
}

export interface GetBlockHash {
    type: typeof MESSAGES.GET_BLOCK_HASH;
    payload: number;
}

export interface GetBlock {
    type: typeof MESSAGES.GET_BLOCK;
    payload: number | string; // height or hash
}

export interface GetAccountInfo {
    type: typeof MESSAGES.GET_ACCOUNT_INFO;
    payload: AccountInfoParams;
}

export interface GetAccountUtxo {
    type: typeof MESSAGES.GET_ACCOUNT_UTXO;
    payload: string; // address or xpub
}

export interface GetTransaction {
    type: typeof MESSAGES.GET_TRANSACTION;
    payload: string;
}

export interface GetTransactionHex {
    type: typeof MESSAGES.GET_TRANSACTION_HEX;
    payload: string;
}

export interface GetFiatRatesTickersList {
    type: typeof MESSAGES.GET_FIAT_RATES_TICKERS_LIST;
    payload: GetFiatRatesTickersListParams;
}

export interface GetAccountBalanceHistory {
    type: typeof MESSAGES.GET_ACCOUNT_BALANCE_HISTORY;
    payload: AccountBalanceHistoryParams;
}

export interface GetCurrentFiatRates {
    type: typeof MESSAGES.GET_CURRENT_FIAT_RATES;
    payload: GetCurrentFiatRatesParams;
}

export interface GetFiatRatesForTimestamps {
    type: typeof MESSAGES.GET_FIAT_RATES_FOR_TIMESTAMPS;
    payload: GetFiatRatesForTimestampsParams;
}

export interface EstimateFee {
    type: typeof MESSAGES.ESTIMATE_FEE;
    payload: EstimateFeeParams;
}

export interface RpcCall {
    type: typeof MESSAGES.RPC_CALL;
    payload: RpcCallParams;
}

export interface Subscribe {
    type: typeof MESSAGES.SUBSCRIBE;
    payload:
        | {
              type: 'block';
          }
        | {
              type: 'mempool';
          }
        | {
              type: 'addresses';
              addresses: string[];
          }
        | {
              type: 'accounts';
              accounts: SubscriptionAccountInfo[];
          }
        | {
              type: 'fiatRates';
              currency?: string;
          };
}

export interface Unsubscribe {
    type: typeof MESSAGES.UNSUBSCRIBE;
    payload:
        | {
              type: 'block';
          }
        | {
              type: 'mempool';
          }
        | {
              type: 'addresses';
              addresses?: string[];
          }
        | {
              type: 'accounts';
              accounts?: SubscriptionAccountInfo[];
          }
        | {
              type: 'fiatRates';
          };
}

export interface PushTransaction {
    type: typeof MESSAGES.PUSH_TRANSACTION;
    payload: string;
}

export type Message =
    | ChannelMessage<{ type: typeof MESSAGES.TERMINATE; payload?: typeof undefined }>
    | ChannelMessage<{ type: typeof MESSAGES.HANDSHAKE; settings: BlockchainSettings }>
    | ChannelMessage<Connect>
    | ChannelMessage<Disconnect>
    | ChannelMessage<GetInfo>
    | ChannelMessage<GetBlockHash>
    | ChannelMessage<GetBlock>
    | ChannelMessage<GetAccountInfo>
    | ChannelMessage<GetAccountUtxo>
    | ChannelMessage<GetTransaction>
    | ChannelMessage<GetTransactionHex>
    | ChannelMessage<GetCurrentFiatRates>
    | ChannelMessage<GetFiatRatesForTimestamps>
    | ChannelMessage<GetAccountBalanceHistory>
    | ChannelMessage<GetFiatRatesTickersList>
    | ChannelMessage<EstimateFee>
    | ChannelMessage<RpcCall>
    | ChannelMessage<Subscribe>
    | ChannelMessage<Unsubscribe>
    | ChannelMessage<PushTransaction>;
