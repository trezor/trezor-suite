import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader, type TradingStackRoutes } from '@suite-native/navigation';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';
import { type TradingStackScreenProps } from '@suite-native/trading-types';

import { ApprovalButton } from '../components/exchange/Approval/ApprovalButton';
import { LimitPicker } from '../components/exchange/Approval/LimitPicker';
import { ExchangeFlowApprovalFeeSelectorRow } from '../components/exchange/Flow/ExchangeFlowApprovalFeeSelectorRow';
import { ExchangeFlowApproveStepContent } from '../components/exchange/Flow/ExchangeFlowApproveStepContent';
import { ExchangeFlowIncreaseStepContent } from '../components/exchange/Flow/ExchangeFlowIncreaseStepContent';
import { ExchangeFlowScreenHeader } from '../components/exchange/Flow/ExchangeFlowScreenHeader';
import { ExchangeFlowStepsLayout } from '../components/exchange/Flow/ExchangeFlowStepsLayout';
import { useExchangeApprovalStep } from '../hooks/exchange/Approval/useExchangeApprovalStep';
import { getExchangeApprovalFlowStatus } from '../utils/exchange/exchangeFlowSteps';

type TradingExchangeApprovalScreenProps =
    TradingStackScreenProps<TradingStackRoutes.TradingExchangeApproval>;

export const TradingExchangeApprovalScreen = ({
    route: { params },
}: TradingExchangeApprovalScreenProps) => {
    const { shouldIncreaseLimit, isRevoked } = params;
    const approvalStatus = getExchangeApprovalFlowStatus({ isRevoked, shouldIncreaseLimit });
    const { quote, coinSymbol, isApprovalReady, isDisabled, onApprovalTypeChange } =
        useExchangeApprovalStep({ isRevoked });
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

    const limitRow = <LimitPicker onApprovalTypeChange={onApprovalTypeChange} />;
    const feeRow = <ExchangeFlowApprovalFeeSelectorRow accountKey={account.key} />;

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
            {approvalStatus === 'needs_increase' ? (
                <ExchangeFlowIncreaseStepContent
                    coinSymbol={coinSymbol}
                    limitRow={limitRow}
                    feeRow={feeRow}
                />
            ) : (
                <ExchangeFlowApproveStepContent
                    coinSymbol={coinSymbol}
                    limitRow={limitRow}
                    feeRow={feeRow}
                />
            )}
        </ExchangeFlowStepsLayout>
    );
};
