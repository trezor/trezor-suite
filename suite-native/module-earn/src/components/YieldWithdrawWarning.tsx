import { InlineAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type YieldWithdrawWarningProps = {
    isAmountTooHigh: boolean;
    shouldShowNetworkFeeWarning: boolean;
};

export const YieldWithdrawWarning = ({
    isAmountTooHigh,
    shouldShowNetworkFeeWarning,
}: YieldWithdrawWarningProps) => {
    if (isAmountTooHigh) {
        return (
            <InlineAlertBox
                variant="warning"
                title={<Translation id="earn.yieldWithdrawFlowScreen.amountExceedsSupplied" />}
            />
        );
    }

    if (shouldShowNetworkFeeWarning) {
        return (
            <InlineAlertBox
                variant="warning"
                title={<Translation id="earn.yieldWithdrawFlowScreen.networkFeeWarning" />}
            />
        );
    }

    return null;
};
