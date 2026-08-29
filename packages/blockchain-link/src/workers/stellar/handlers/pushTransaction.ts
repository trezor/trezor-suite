import type { MessageTypes } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import stellar from '@trezor/network-stellar/runtime';

import type { Request } from '../types';

export const pushTransaction = async (
    { connect, payload }: Request<MessageTypes.PushTransaction>,
    isTestnet: boolean,
) => {
    const api = await connect();
    const { parseTransactionFromHex } = await stellar();
    const parsedTx = parseTransactionFromHex(payload.hex, isTestnet);
    try {
        const resp = await api.submitTransaction(parsedTx, { skipMemoRequiredCheck: true });

        return {
            type: RESPONSES.PUSH_TRANSACTION,
            payload: resp.hash,
        } as const;
    } catch (e) {
        const txResultCode: string =
            e?.response?.data?.extras?.result_codes?.transaction || 'unknown';
        const opResultCode: string =
            e?.response?.data?.extras?.result_codes?.operations?.[0] || 'unknown';
        throw Object.assign(
            new Error(
                `transaction result code: ${txResultCode}, operation result code: ${opResultCode}`,
            ),
            { cause: e },
        );
    }
};
