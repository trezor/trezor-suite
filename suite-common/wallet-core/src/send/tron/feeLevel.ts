import { type NetworkSymbol } from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

import { type EstimateFeeLevel } from './types';

type ContractCallFeeResult = EstimateFeeLevel | { error: string };

export const estimateContractCallFeeLevel = async ({
    symbol,
    identity,
    from,
    to,
    data,
}: {
    symbol: NetworkSymbol;
    identity: string | undefined;
    from: string;
    to: string;
    data: string;
}): Promise<ContractCallFeeResult> => {
    const estimatedFee = await TrezorConnect.blockchainEstimateFee({
        coin: asCoinSymbol(symbol),
        identity,
        request: {
            blocks: [1],
            specific: { from, to, value: '0x0', data: `0x${data}` },
        },
    });

    if (!estimatedFee.success) {
        return { error: estimatedFee.error.message };
    }

    const [firstLevel] = estimatedFee.payload.levels;

    if (!firstLevel) {
        return { error: 'No fee level returned from backend.' };
    }

    return firstLevel;
};
