import { BLOCKCHAIN } from '../constants';
import { CoinInfo } from '../networks/coinInfo';
import { AccountAddresses, AccountTransaction, FeeLevel } from '../account';
import { TypedRawTransaction } from './transactions';

export interface BlockchainInfo {
    coin: CoinInfo;
    url: string;
    cleanUrl?: string;
    blockHash: string;
    blockHeight: number;
    decimals: number;
    name: string;
    shortcut: string;
    testnet: boolean;
    version: string;
    misc?: {
        reserve?: string;
    };
}

export interface BlockchainBlock {
    blockHash: string;
    blockHeight: number;
    coin: CoinInfo;
}

export interface BlockchainError {
    coin: CoinInfo;
    error: string;
    code?: string;
}

export interface BlockchainNotification {
    coin: CoinInfo;
    notification: {
        descriptor: string;
        tx: AccountTransaction;
    };
}

export interface BlockchainSubscribeAccount {
    descriptor: string;
    addresses?: AccountAddresses; // bitcoin addresses
}

export interface BlockchainSubscribe {
    accounts?: BlockchainSubscribeAccount[];
    coin: string;
}

export interface BlockchainSubscribed {
    subscribed: boolean;
}

export interface BlockchainDisconnect {
    coin: string;
}

export interface BlockchainDisconnected {
    disconnected: boolean;
}

export interface BlockchainGetTransactions {
    coin: string;
    txs: string[];
}

export type BlockchainTransactions = TypedRawTransaction[];

export interface BlockchainEstimateFee {
    coin: string;
    request?: {
        blocks?: number[];
        specific?: {
            conservative?: boolean;
            data?: string;
            from?: string;
            to?: string;
            value?: string;
            txsize?: number;
        };
        feeLevels?: 'preloaded' | 'smart';
    };
}

export interface BlockchainEstimatedFee {
    blockTime: number;
    minFee: number;
    maxFee: number;
    levels: FeeLevel[];
    dustLimit?: number;
}

export interface BlockchainFiatRates {
    [k: string]: number | undefined;
}

export interface BlockchainFiatRatesUpdate {
    coin: CoinInfo;
    rates: BlockchainFiatRates;
}

export interface BlockchainSubscribeFiatRates {
    currency?: string;
    coin: string;
}

export interface BlockchainGetCurrentFiatRates {
    coin: string;
    currencies?: string[];
}

export interface BlockchainTimestampedFiatRates {
    ts: number;
    rates: BlockchainFiatRates;
}

export interface BlockchainGetFiatRatesForTimestamps {
    coin: string;
    timestamps: number[];
}

export interface BlockchainFiatRatesForTimestamps {
    tickers: BlockchainTimestampedFiatRates[];
}

export interface BlockchainGetAccountBalanceHistory {
    coin: string;
    descriptor: string;
    from?: number;
    to?: number;
    groupBy?: number;
}

export interface BlockchainAccountBalanceHistory {
    time: number;
    txs: number;
    received: string;
    sent: string;
    sentToSelf?: string;
    rates: BlockchainFiatRates;
}

export interface BlockchainSetCustomBackend {
    coin: string;
    blockchainLink?: CoinInfo['blockchainLink'];
}

export type BlockchainEvent =
    | {
          type: typeof BLOCKCHAIN.CONNECT;
          payload: BlockchainInfo;
      }
    | {
          type: typeof BLOCKCHAIN.ERROR;
          payload: BlockchainError;
      }
    | {
          type: typeof BLOCKCHAIN.BLOCK;
          payload: BlockchainBlock;
      }
    | {
          type: typeof BLOCKCHAIN.NOTIFICATION;
          payload: BlockchainNotification;
      }
    | {
          type: typeof BLOCKCHAIN.FIAT_RATES_UPDATE;
          payload: BlockchainFiatRatesUpdate;
      };
