import type { Messages } from '@trezor/transport';
import type { Params, Response } from '../params';

// BinanceSDKTransaction from https://github.com/binance-chain/javascript-sdk/blob/master/src/tx/index.js

export interface BinanceSDKTransaction {
    chain_id: string;
    account_number?: number; // default 0
    memo?: string;
    sequence?: number; // default 0
    source?: number; // default 0

    transfer?: Messages.BinanceTransferMsg;
    placeOrder?: Messages.BinanceOrderMsg;
    cancelOrder?: Messages.BinanceCancelMsg;
}

export type BinancePreparedMessage =
    | (Messages.BinanceTransferMsg & {
          type: 'BinanceTransferMsg';
      })
    | (Messages.BinanceOrderMsg & {
          type: 'BinanceOrderMsg';
      })
    | (Messages.BinanceCancelMsg & {
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
): Response<Messages.BinanceSignedTx>;
