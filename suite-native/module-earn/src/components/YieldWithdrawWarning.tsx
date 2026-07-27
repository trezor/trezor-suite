import { InlineAlertBox, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type YieldWithdrawWarningProps = {
    isAmountTooHigh: boolean;
    isMaxWithdrawInfoVisible: boolean;
    shouldShowNetworkFeeWarning: boolean;
    vaultTokenSymbol: string;
};

export const YieldWithdrawWarning = ({
    isAmountTooHigh,
    isMaxWithdrawInfoVisible,
    shouldShowNetworkFeeWarning,
    vaultTokenSymbol,
}: YieldWithdrawWarningProps) => {
    if (isAmountTooHigh) {
        return (
            <InlineAlertBox
                intent="warning"
                title={<Translation id="earn.yieldWithdrawFlowScreen.amountExceedsDeposited" />}
            />
        );
    }

    if (!shouldShowNetworkFeeWarning && !isMaxWithdrawInfoVisible) {
        return null;
    }

    return (
        <VStack spacing="sp16">
            {shouldShowNetworkFeeWarning && (
                <InlineAlertBox
                    intent="warning"
                    title={<Translation id="earn.yieldWithdrawFlowScreen.networkFeeWarning" />}
                />
            )}
            {isMaxWithdrawInfoVisible && (
                <InlineAlertBox
                    intent="info"
                    title={
                        <Translation
                            id="earn.yieldWithdrawFlowScreen.maxWithdrawInfo"
                            values={{ vaultTokenSymbol }}
                        />
                    }
                />
            )}
        </VStack>
    );
};
