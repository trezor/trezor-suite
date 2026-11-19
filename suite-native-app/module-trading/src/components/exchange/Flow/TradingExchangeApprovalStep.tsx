import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type ExchangeFlowApprovalStatus, Screen, ScreenHeader } from '@suite-native/navigation';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { ExchangeFlowApproveStepContent } from './ExchangeFlowApproveStepContent';
import { ExchangeFlowIncreaseStepContent } from './ExchangeFlowIncreaseStepContent';
import { ExchangeFlowScreenHeader } from './ExchangeFlowScreenHeader';
import { ExchangeFlowStepsLayout } from './ExchangeFlowStepsLayout';
import { useExchangeApprovalStep } from '../../../hooks/exchange/Approval/useExchangeApprovalStep';
import { getExchangeApprovalStepVariant } from '../../../utils/exchange/exchangeFlowSteps';
import { ApprovalButton } from '../Approval/ApprovalButton';

export type TradingExchangeApprovalStepProps = {
    approvalStatus: ExchangeFlowApprovalStatus;
};

export const TradingExchangeApprovalStep = ({
    approvalStatus,
}: TradingExchangeApprovalStepProps) => {
    const variant = getExchangeApprovalStepVariant(approvalStatus);
    const { quote, coinSymbol, isApprovalReady, isDisabled, onApprovalTypeChange } =
        useExchangeApprovalStep({ isRevoked: variant === 'afterRevoke' });

    const account = useSelector(selectExchangeSelectedSendAccount);

    useEffect(() => {
        if (!account) {
            console.error('No account selected for exchange approval details');
        }
    }, [account]);

    if (!quote || !account) {
        return (
            <Screen header={<ScreenHeader closeActionType="back" />}>
                <BannerInline
                    title={
                        <Translation id="moduleTrading.tradingExchangeApprovalScreen.approveErrorAlert" />
                    }
                    intent="critical"
                />
            </Screen>
        );
    }

    return (
        <ExchangeFlowStepsLayout
            approvalStatus={approvalStatus}
            currentStep="approval"
            header={<ExchangeFlowScreenHeader />}
            footer={
                <ApprovalButton
                    isReady={isApprovalReady}
                    isDisabled={isDisabled}
                    flowType="approve"
                />
            }
        >
            {variant === 'increase' ? (
                <ExchangeFlowIncreaseStepContent
                    accountKey={account.key}
                    coinSymbol={coinSymbol}
                    onApprovalTypeChange={onApprovalTypeChange}
                />
            ) : (
                <ExchangeFlowApproveStepContent
                    accountKey={account.key}
                    coinSymbol={coinSymbol}
                    onApprovalTypeChange={onApprovalTypeChange}
                />
            )}
        </ExchangeFlowStepsLayout>
    );
};
