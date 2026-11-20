import { type NetworkType } from '@suite-common/wallet-config';
import { type GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { calculateTotalGasCost, fromGwei } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

type EstimateFeeParams = {
    networkType: NetworkType;
    feePerUnit: string | undefined;
    referenceFeeLevel: GeneralPrecomposedTransactionFinal | undefined;
    feeLimit?: string;
};

export const estimateFee = ({
    networkType,
    feePerUnit,
    referenceFeeLevel,
    feeLimit,
}: EstimateFeeParams): string | null => {
    if (!feePerUnit) return null;

    const rate = new BigNumber(feePerUnit);
    const size = new BigNumber(
        (networkType === 'ethereum'
            ? (feeLimit ?? referenceFeeLevel?.feeLimit)
            : referenceFeeLevel?.bytes) ?? 0,
    );
    if (!rate.isFinite() || !rate.gt(0) || !size.isFinite() || !size.gt(0)) return null;

    if (networkType === 'ethereum') {
        return calculateTotalGasCost(fromGwei(feePerUnit).toWei(), size.toFixed());
    }
    if (networkType === 'bitcoin') return rate.times(size).toFixed(0, BigNumber.ROUND_CEIL);

    return null;
};
