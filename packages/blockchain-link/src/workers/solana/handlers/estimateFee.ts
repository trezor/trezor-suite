import type { MessageTypes, ResponseTypes } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import solana from '@trezor/network-solana/runtime';
import { BigNumber } from '@trezor/utils';

import type { Request } from '../types';

export const estimateFee = async (
    request: Request<MessageTypes.EstimateFee>,
): Promise<ResponseTypes.EstimateFee> => {
    const api = await request.connect();
    const { getFees, getSolanaTokenAccountInfos } = await solana();

    const { data: messageHex, newAccountProgramName, solanaToken } = request.payload.specific ?? {};

    if (messageHex == null) {
        throw new Error('Could not estimate fee for transaction.');
    }

    const { baseFee, priorityFee, accountCreationFee, decompiledTransactionMessage } =
        await getFees(messageHex, newAccountProgramName, api);
    const resolvedTokenAccountInfos = solanaToken
        ? await getSolanaTokenAccountInfos({
              baseAddress: solanaToken.baseAddress,
              instructions: decompiledTransactionMessage.instructions,
              tokenMint: solanaToken.mint,
          })
        : [];
    const solanaTokenAccountInfos =
        resolvedTokenAccountInfos.length > 0 ? resolvedTokenAccountInfos : undefined;

    const payload = [
        {
            feePerTx: new BigNumber(baseFee.toString())
                .plus(priorityFee.fee)
                .plus(accountCreationFee.toString())
                .toString(10),
            feePerUnit: priorityFee.computeUnitPrice,
            feeLimit: priorityFee.computeUnitLimit,
            feePayer: decompiledTransactionMessage.feePayer.address,
            solanaTokenAccountInfos,
        },
    ];

    return {
        type: RESPONSES.ESTIMATE_FEE,
        payload,
    } as const;
};
