import type { ServerInfo, BlockEvent, FiatRates, NotificationEvent } from '@trezor/blockchain-link';
import type { CoinInfo } from '../types/coinInfo';
import type { MessageFactoryFn } from '../types/utils';

export const BLOCKCHAIN_EVENT = 'BLOCKCHAIN_EVENT';
export const BLOCKCHAIN = {
    CONNECT: 'blockchain-connect',
    ERROR: 'blockchain-error',
    BLOCK: 'blockchain-block',
    NOTIFICATION: 'blockchain-notification',
    FIAT_RATES_UPDATE: 'fiat-rates-update',
} as const;

export interface BlockchainInfo extends ServerInfo {
    coin: CoinInfo;
    misc?: {
        reserve?: string;
    };
}

export interface BlockchainError {
    coin: CoinInfo;
    error: string;
    code?: string;
}

export type BlockchainBlock = BlockEvent['payload'] & {
    coin: CoinInfo;
};

export interface BlockchainNotification {
    coin: CoinInfo;
    notification: NotificationEvent['payload'];
}

export interface BlockchainFiatRatesUpdate {
    coin: CoinInfo;
    rates: FiatRates;
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

export type BlockchainEventMessage = BlockchainEvent & { event: typeof BLOCKCHAIN_EVENT };

export type BlockchainEventListenerFn = (
    type: typeof BLOCKCHAIN_EVENT,
    cb: (event: BlockchainEventMessage) => void,
) => void;

export const createBlockchainMessage: MessageFactoryFn<typeof BLOCKCHAIN_EVENT, BlockchainEvent> = (
    type,
    payload,
) =>
    ({
        event: BLOCKCHAIN_EVENT,
        type,
        payload,
    }) as any;
