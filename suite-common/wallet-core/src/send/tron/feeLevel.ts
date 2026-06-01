import { type NetworkSymbol } from '@suite-common/wallet-config';
import { tronUtils } from '@trezor/blockchain-link-utils';
import TrezorConnect from '@trezor/connect';

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
        coin: symbol,
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

export const computeBandwidthFeeLevel = ({
    availableStakedBandwidth,
    availableFreeBandwidth,
    bytes,
}: {
    availableStakedBandwidth: number;
    availableFreeBandwidth: number;
    bytes: number;
}): EstimateFeeLevel => {
    const availableBandwidth = Math.max(availableStakedBandwidth, availableFreeBandwidth);
    const feeInSun = availableBandwidth < bytes ? bytes * tronUtils.TRON_BANDWIDTH_SUN_PRICE : 0;

    return {
        feePerTx: String(feeInSun),
        feePerUnit: String(tronUtils.TRON_BANDWIDTH_SUN_PRICE),
    };
};
