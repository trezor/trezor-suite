import type { NetworkSymbol } from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';
import type { BlockchainEstimatedFee } from '@trezor/connect-common/src/types/api/blockchain/blockchainEstimateFee';
import { type Result, err, ok } from '@trezor/type-utils';

export type YieldFeeEstimationError = 'fee-estimation-failed';
export type YieldEstimatedFeeLevel = BlockchainEstimatedFee['levels'][number] & {
    feeLimit: string;
};

type EstimateYieldFeeLevelParams = {
    coin: NetworkSymbol;
    identity?: string;
    from: string;
    to: string;
    data: string;
};

export const estimateYieldFeeLevel = async ({
    coin,
    identity,
    from,
    to,
    data,
}: EstimateYieldFeeLevelParams): Promise<
    Result<YieldEstimatedFeeLevel, YieldFeeEstimationError>
> => {
    const estimatedFee = await TrezorConnect.blockchainEstimateFee({
        coin,
        identity,
        request: {
            blocks: [2],
            specific: {
                from,
                to,
                data,
                value: '0x0',
            },
        },
    });

    if (!estimatedFee.success) {
        return err('fee-estimation-failed');
    }

    const feeLevel = estimatedFee.payload.levels[0];

    if (!feeLevel?.feeLimit) {
        return err('fee-estimation-failed');
    }

    return ok({ ...feeLevel, feeLimit: feeLevel.feeLimit });
};
