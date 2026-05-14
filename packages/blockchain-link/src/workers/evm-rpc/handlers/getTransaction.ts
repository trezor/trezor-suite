import { CustomError } from '@trezor/blockchain-link-types';
import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';

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
