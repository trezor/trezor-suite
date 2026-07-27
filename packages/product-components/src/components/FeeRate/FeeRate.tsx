import { type NetworkType } from '@suite-common/wallet-config';
import { EVM_FEE_RATE_DECIMALS } from '@suite-common/wallet-core/src/fees/feesConstants';
import { getFeeUnits } from '@suite-common/wallet-utils/src/feeUnitUtils';
import { BigNumber } from '@trezor/utils';

type FeeRateProps = {
    feeRate?: string | BigNumber;
    networkType: NetworkType;
    preserveDecimals?: boolean;
};

export const FeeRate = ({ feeRate, networkType, preserveDecimals }: FeeRateProps) => {
    if (!feeRate) return null;

    const fee = (() => {
        switch (networkType) {
            case 'ethereum': {
                const multiplier = Math.pow(10, EVM_FEE_RATE_DECIMALS);
                const value = Math.ceil(Number(feeRate) * multiplier) / multiplier;

                return preserveDecimals ? feeRate.toString() : value.toFixed(EVM_FEE_RATE_DECIMALS);
            }
            case 'bitcoin': {
                const feeBn = typeof feeRate === 'string' ? new BigNumber(feeRate) : feeRate;

                return feeBn.toFixed(2);
            }
            default:
                return typeof feeRate === 'string' ? feeRate : feeRate.toString();
        }
    })();

    return (
        <span data-testid="@fee-rate">
            {fee}&nbsp;{getFeeUnits(networkType)}
        </span>
    );
};
