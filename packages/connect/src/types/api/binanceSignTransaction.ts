import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

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

export type BinancePreparedTransaction = Required<BinanceSDKTransaction> & {
    messages: BinancePreparedMessage[];
};

export interface BinanceSignTransaction {
    path: string | number[];
    transaction: BinanceSDKTransaction;
}

export declare function binanceSignTransaction(
    params: Params<BinanceSignTransaction>,
): Response<PROTO.BinanceSignedTx>;
