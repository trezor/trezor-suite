import { type BaseCurrencyAmount } from '@suite-common/wallet-types';

type ShouldShowClaimFeeWarningParams = {
    feeFiatAmount: BaseCurrencyAmount | null;
    totalFiatClaimableAmount: BaseCurrencyAmount | null;
};

export const shouldShowClaimFeeWarning = ({
    feeFiatAmount,
    totalFiatClaimableAmount,
}: ShouldShowClaimFeeWarningParams) =>
    feeFiatAmount !== null &&
    totalFiatClaimableAmount !== null &&
    feeFiatAmount.gt(totalFiatClaimableAmount);
