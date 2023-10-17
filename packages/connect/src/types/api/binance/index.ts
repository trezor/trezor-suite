import type { PROTO } from '../../../constants';
import type { DerivationPath } from '../../params';

// BinanceSDKTransaction from https://github.com/binance-chain/javascript-sdk/blob/master/src/tx/index.js

export interface BinanceSDKTransaction {
    chain_id: string;
    account_number?: number; // default 0
    memo?: string;
    sequence?: number; // default 0
    source?: number; // default 0

    transfer?: PROTO.BinanceTransferMsg;
    placeOrder?: PROTO.BinanceOrderMsg;
    cancelOrder?: PROTO.BinanceCancelMsg;
}

export type BinancePreparedMessage =
    | (PROTO.BinanceTransferMsg & {
          type: 'BinanceTransferMsg';
      })
    | (PROTO.BinanceOrderMsg & {
          type: 'BinanceOrderMsg';
      })
    | (PROTO.BinanceCancelMsg & {
          type: 'BinanceCancelMsg';
      });

export interface BinancePreparedTransaction extends BinanceSDKTransaction {
    messages: BinancePreparedMessage[];
    account_number: number;
    sequence: number;
    source: number;
}

export interface BinanceSignTransaction {
    path: DerivationPath;
    transaction: BinanceSDKTransaction;
    chunkify?: boolean;
}
