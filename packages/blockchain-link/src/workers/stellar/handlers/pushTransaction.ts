import type { MessageTypes } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import stellar from '@trezor/network-stellar/runtime';

import type { Request } from '../types';

export const pushTransaction = async (
    { connect, payload }: Request<MessageTypes.PushTransaction>,
    isTestnet: boolean,
) => {
    const api = await connect();
    const { createStellarDataSource, parseTransactionFromHex } = await stellar();

    const transaction = parseTransactionFromHex(payload.hex, isTestnet);

    return {
        type: RESPONSES.PUSH_TRANSACTION,
        payload: await createStellarDataSource(api).submitTransaction(transaction),
    } as const;
};
