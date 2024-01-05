import { PROTO } from '../../../constants';
import { DerivationPath } from '../../params';
import { Type, Static } from '@trezor/schema-utils';

// BinanceSDKTransaction from https://github.com/binance-chain/javascript-sdk/blob/master/src/tx/index.js

export type BinanceSDKTransaction = Static<typeof BinanceSDKTransaction>;
export const BinanceSDKTransaction = Type.Object({
    chain_id: Type.String(),
    account_number: Type.Optional(Type.Number()),
    memo: Type.Optional(Type.String()),
    sequence: Type.Optional(Type.Number()),
    source: Type.Optional(Type.Number()),
    transfer: Type.Optional(PROTO.BinanceTransferMsg),
    placeOrder: Type.Optional(PROTO.BinanceOrderMsg),
    cancelOrder: Type.Optional(PROTO.BinanceCancelMsg),
});

export type BinancePreparedMessage = Static<typeof BinancePreparedMessage>;
export const BinancePreparedMessage = Type.Union([
    Type.Intersect([
        PROTO.BinanceTransferMsg,
        Type.Object({
            type: Type.Literal('BinanceTransferMsg'),
        }),
    ]),
    Type.Intersect([
        PROTO.BinanceOrderMsg,
        Type.Object({
            type: Type.Literal('BinanceOrderMsg'),
        }),
    ]),
    Type.Intersect([
        PROTO.BinanceCancelMsg,
        Type.Object({
            type: Type.Literal('BinanceCancelMsg'),
        }),
    ]),
]);

export type BinancePreparedTransaction = Static<typeof BinancePreparedTransaction>;
export const BinancePreparedTransaction = Type.Intersect([
    BinanceSDKTransaction,
    Type.Object({
        messages: Type.Array(BinancePreparedMessage),
        account_number: Type.Number(),
        sequence: Type.Number(),
        source: Type.Number(),
    }),
]);

export type BinanceSignTransaction = Static<typeof BinanceSignTransaction>;
export const BinanceSignTransaction = Type.Object({
    path: DerivationPath,
    transaction: BinanceSDKTransaction,
    chunkify: Type.Optional(Type.Boolean()),
});
