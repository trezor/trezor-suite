import { CustomError } from '@trezor/blockchain-link-types/src/constants/errors';
import type * as MessageTypes from '@trezor/blockchain-link-types/src/messages';
import type * as Responses from '@trezor/blockchain-link-types/src/responses';

import { mapGetTransactionResponse } from '../mappers/transaction';
import type { Request } from '../types';
import { toHex } from '../utils/hex';

export const getTransaction = async (
    request: Request<MessageTypes.GetTransaction>,
): Promise<Responses.GetTransaction> => {
    const client = await request.connect();
    const hash = toHex(request.payload);

    const [tx, receipt] = await Promise.all([
        client.getTransaction({ hash }),
        client.getTransactionReceipt({ hash }),
    ]);

    if (!tx) {
        throw new CustomError('worker_runtime', `Transaction ${hash} not found`);
    }
    const block = await client.getBlock({ blockNumber: tx.blockNumber });

    return mapGetTransactionResponse({ tx, receipt, block, userAddress: '' });
};
