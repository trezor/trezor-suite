import type { MessageTypes } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import solana from '@trezor/network-solana/runtime';
import { BigNumber } from '@trezor/utils';

import type { Request } from '../types';

export const estimateFee = async (request: Request<MessageTypes.EstimateFee>) => {
    const api = await request.connect();
    const { getFees } = await solana();

    const { data: messageHex, newAccountProgramName } = request.payload.specific ?? {};

    if (messageHex == null) {
        throw new Error('Could not estimate fee for transaction.');
    }

    const { baseFee, priorityFee, accountCreationFee, decompiledTransactionMessage } =
        await getFees(messageHex, newAccountProgramName, api);

    const payload = [
        {
            feePerTx: new BigNumber(baseFee.toString())
                .plus(priorityFee.fee)
                .plus(accountCreationFee.toString())
                .toString(10),
            feePerUnit: priorityFee.computeUnitPrice,
            feeLimit: priorityFee.computeUnitLimit,
            feePayer: decompiledTransactionMessage.feePayer.address,
        },
    ];

    return {
        type: RESPONSES.ESTIMATE_FEE,
        payload,
    } as const;
};
