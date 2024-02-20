// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/binanceSignTx.js

import { PROTO, ERRORS } from '../../constants';
import {
    BinanceSDKTransaction,
    BinancePreparedMessage,
    BinancePreparedTransaction,
} from '../../types/api/binance';
import type { TypedCall } from '../../device/DeviceCommands';
import { Assert } from '@trezor/schema-utils';

const processTxRequest = async (
    typedCall: TypedCall,
    messages: BinancePreparedMessage[],
    index: number,
): Promise<PROTO.BinanceSignedTx> => {
    const { type, ...params } = messages[index];
    const lastOp = index + 1 >= messages.length;

    if (lastOp) {
        const response = await typedCall(type, 'BinanceSignedTx', params);

        return response.message;
    }
    await typedCall(type, 'BinanceTxRequest', params);
    index++;

    return processTxRequest(typedCall, messages, index);
};

// validate and translate params to protobuf
export const validate = (tx: BinanceSDKTransaction) => {
    Assert(BinanceSDKTransaction, tx);

    const preparedTx: BinancePreparedTransaction = {
        chain_id: tx.chain_id,
        account_number: tx.account_number || 0,
        memo: tx.memo,
        sequence: tx.sequence || 0,
        source: tx.source || 0,
        messages: [],
    };

    const { transfer, placeOrder, cancelOrder } = tx;

    if (transfer) {
        preparedTx.messages.push({
            ...transfer,
            type: 'BinanceTransferMsg',
        });
    }

    if (placeOrder) {
        preparedTx.messages.push({
            ...placeOrder,
            type: 'BinanceOrderMsg',
        });
    }

    if (cancelOrder) {
        preparedTx.messages.push({
            ...cancelOrder,
            type: 'BinanceCancelMsg',
        });
    }

    if (preparedTx.messages.length < 1) {
        throw ERRORS.TypedError('Method_InvalidParameter', 'Transaction does not have any message');
    }

    return preparedTx;
};

export const signTx = async (
    typedCall: TypedCall,
    address_n: number[],
    tx: BinancePreparedTransaction,
    chunkify?: boolean,
) => {
    const { account_number, chain_id, memo, sequence, source, messages } = tx;
    const msg_count = messages.length;

    await typedCall('BinanceSignTx', 'BinanceTxRequest', {
        address_n,
        msg_count,
        account_number,
        chain_id,
        memo,
        sequence,
        source,
        chunkify,
    });

    return processTxRequest(typedCall, messages, 0);
};
