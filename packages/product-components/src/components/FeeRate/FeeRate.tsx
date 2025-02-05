import { NetworkType } from '@suite-common/wallet-config';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

type FeeRateProps = {
    feeRate?: string | BigNumber;
    networkType: NetworkType;
};

export const FeeRate = ({ feeRate, networkType }: FeeRateProps) => {
    if (!feeRate) return null;

    const fee = typeof feeRate === 'string' ? new BigNumber(feeRate) : feeRate;

    return (
        <span>
            {networkType === 'bitcoin' ? fee.toFixed(2) : fee.toString()}&nbsp;
            {getFeeUnits(networkType)}
        </span>
    );
};
