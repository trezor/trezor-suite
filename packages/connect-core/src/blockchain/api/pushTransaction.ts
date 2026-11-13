import type { PostMessage } from '@trezor/blockchain-core/src/backend/Blockchain';
import { initCoinBackend } from '@trezor/blockchain-core/src/backend/BlockchainLink';
import { getBackendCoinInfo } from '@trezor/blockchain-core/src/data/coinInfo';
import { PushTransaction } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';


export const pushTransaction = async (params: PushTransaction, postMessage: PostMessage) => {
    Assert(PushTransaction, params);
    if (
        getBackendCoinInfo(params.coin).type === 'bitcoin' &&
        (typeof params.tx !== 'string' || !/^[0-9A-Fa-f]*$/.test(params.tx))
    ) {
        throw ERRORS.TypedError('Method_InvalidParameter', 'Transaction must be hexadecimal');
    }
    const backend = await initCoinBackend(params, postMessage);
    const txid = await backend.pushTransaction(params.tx);

    return { txid };
};
