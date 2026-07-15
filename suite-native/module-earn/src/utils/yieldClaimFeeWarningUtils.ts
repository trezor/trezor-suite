import { type BaseCurrencyAmount } from '@suite-common/wallet-types';

export type YieldClaimFeeWarning = 'fee-exceeds-rewards' | 'unverifiable-rewards-value';

type GetClaimFeeWarningParams = {
    feeFiatAmount: BaseCurrencyAmount | null;
    totalFiatClaimableAmount: BaseCurrencyAmount | null;
};

export const getClaimFeeWarning = ({
    feeFiatAmount,
    totalFiatClaimableAmount,
}: GetClaimFeeWarningParams): YieldClaimFeeWarning | null => {
    // Missing fiat data means the fee-vs-rewards check cannot run, which must
    // surface to the user instead of silently suppressing the warning.
    if (feeFiatAmount === null || totalFiatClaimableAmount === null) {
        return 'unverifiable-rewards-value';
    }

    return feeFiatAmount.gt(totalFiatClaimableAmount) ? 'fee-exceeds-rewards' : null;
};
