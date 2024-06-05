import type {
    ServerInfo,
    BlockEvent,
    FiatRatesBySymbol,
    NotificationEvent,
} from '@trezor/blockchain-link';
import type { CoinInfo } from '../types/coinInfo';
import type { MessageFactoryFn } from '../types/utils';

export const BLOCKCHAIN_EVENT = 'BLOCKCHAIN_EVENT';
export const BLOCKCHAIN = {
    CONNECT: 'blockchain-connect',
    RECONNECTING: 'blockchain-reconnecting',
    ERROR: 'blockchain-error',
    BLOCK: 'blockchain-block',
    NOTIFICATION: 'blockchain-notification',
    FIAT_RATES_UPDATE: 'fiat-rates-update',
} as const;

export interface BlockchainInfo extends ServerInfo {
    coin: CoinInfo;
    identity?: string;
    misc?: {
        reserve?: string;
    };
}

export interface BlockchainReconnecting {
    coin: CoinInfo;
    identity?: string;
    time: number;
}

export interface BlockchainError {
    coin: CoinInfo;
    identity?: string;
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
    rates: FiatRatesBySymbol;
}

export type BlockchainEvent =
    | {
          type: typeof BLOCKCHAIN.CONNECT;
          payload: BlockchainInfo;
      }
    | {
          type: typeof BLOCKCHAIN.RECONNECTING;
          payload: BlockchainReconnecting;
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
