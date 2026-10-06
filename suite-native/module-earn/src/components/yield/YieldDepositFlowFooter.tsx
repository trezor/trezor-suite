import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type YieldApprovalAction } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Button } from '@suite-native/atoms';
import { Translation, type TxKeyPath, useTranslate } from '@suite-native/intl';

import { EarnEstimatedRewards } from '../earn/EarnEstimatedRewards';
import { EarnScreenFooter } from '../earn/EarnScreenFooter';

type YieldDepositFlowFooterProps = {
    accountKey: AccountKey;
    amountValue: string | undefined;
    apy: number | null;
    approvalAction?: YieldApprovalAction;
    isDisabled: boolean;
    isLoading?: boolean;
    isSkipDisabled?: boolean;
    onPress: () => void;
    onSkipPress?: () => void;
    shouldKeepEstimatedRewardsVisible?: boolean;
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

const getSubmitButtonTranslationId = (
    approvalAction?: YieldDepositFlowFooterProps['approvalAction'],
): TxKeyPath => {
    if (approvalAction === 'revoke') {
        return 'earn.yieldDepositFlowScreen.revokeApproval';
    }

    if (approvalAction === 'increase') {
        return 'earn.yieldDepositFlowScreen.increaseApprovalLimit';
    }

    return 'generic.buttons.continue';
};

export const YieldDepositFlowFooter = ({
    accountKey,
    amountValue,
    apy,
    approvalAction,
    isDisabled,
    isLoading = false,
    isSkipDisabled = false,
    onPress,
    onSkipPress,
    shouldKeepEstimatedRewardsVisible = false,
    networkSymbol,
    tokenContract,
}: YieldDepositFlowFooterProps) => {
    const { translate } = useTranslate();

    const buttonTranslationId = getSubmitButtonTranslationId(approvalAction);
    const isApprovalLimitAction = approvalAction === 'increase' || approvalAction === 'revoke';
    const isEstimatedRewardsVisible =
        (shouldKeepEstimatedRewardsVisible || (!isApprovalLimitAction && !isDisabled)) &&
        !!amountValue &&
        apy !== null;

    return (
        <EarnScreenFooter
            estimatedRewards={
                isEstimatedRewardsVisible && (
                    <EarnEstimatedRewards
                        accountKey={accountKey}
                        amountValue={amountValue}
                        apy={apy}
                        label={
                            <Translation id="earn.yieldDepositFlowScreen.estimatedRewardsLabel" />
                        }
                        symbol={networkSymbol}
                        tokenContract={tokenContract}
                    />
                )
            }
            secondaryContent={
                onSkipPress && (
                    <Button
                        accessibilityRole="button"
                        accessibilityLabel={translate('earn.yieldDepositFlowScreen.skipApproval')}
                        intent="neutral"
                        priority="secondary"
                        onPress={onSkipPress}
                        isDisabled={isSkipDisabled}
                    >
                        <Translation id="earn.yieldDepositFlowScreen.skipApproval" />
                    </Button>
                )
            }
        >
            <Button
                accessibilityRole="button"
                accessibilityLabel={translate(buttonTranslationId)}
                onPress={onPress}
                isDisabled={isDisabled}
                isLoading={isLoading}
            >
                <Translation id={buttonTranslationId} />
            </Button>
        </EarnScreenFooter>
    );
};
