import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { BannerInline, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DynamicScreenHeader,
    Screen,
    ScreenHeader,
    type TradingStackRoutes,
} from '@suite-native/navigation';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';
import { type TradingStackScreenProps } from '@suite-native/trading-types';

import { ApprovalButton } from '../components/exchange/Approval/ApprovalButton';
import { ExchangeRevokeDetails } from '../components/exchange/Approval/ExchangeRevokeDetails';
import { ExchangeFlowApprovalFeeSelectorRow } from '../components/exchange/Flow/ExchangeFlowApprovalFeeSelectorRow';
import { ExchangeFlowRevokeStepContent } from '../components/exchange/Flow/ExchangeFlowRevokeStepContent';
import { ExchangeFlowScreenHeader } from '../components/exchange/Flow/ExchangeFlowScreenHeader';
import { ExchangeFlowStepsLayout } from '../components/exchange/Flow/ExchangeFlowStepsLayout';
import { useExchangeRevokeStep } from '../hooks/exchange/Approval/useExchangeRevokeStep';

type TradingExchangeRevokeScreenProps =
    TradingStackScreenProps<TradingStackRoutes.TradingExchangeRevoke>;

const RevokeErrorScreen = () => (
    <Screen header={<ScreenHeader closeActionType="back" />}>
        <BannerInline
            title={<Translation id="moduleTrading.tradingExchangeRevokeScreen.revokeErrorAlert" />}
            intent="critical"
        />
    </Screen>
);

export const TradingExchangeRevokeScreen = ({
    route: { params },
}: TradingExchangeRevokeScreenProps) => {
    const { shouldIncreaseLimit } = params;
    const { quote, coinSymbol, isRevokeReady, isDisabled } = useExchangeRevokeStep();
    const account = useSelector(selectExchangeSelectedSendAccount);

    useEffect(() => {
        if (shouldIncreaseLimit && !account) {
            console.error('No account selected for exchange revoke details');
        }
    }, [shouldIncreaseLimit, account]);

    if (!quote) {
        return <RevokeErrorScreen />;
    }

    // A standalone revoke is not a part of the swap steps.
    if (!shouldIncreaseLimit) {
        return (
            <Screen
                header={
                    <DynamicScreenHeader
                        title={
                            <Translation
                                id="moduleTrading.tradingExchangeRevokeScreen.revokeTitle"
                                values={{ symbol: coinSymbol }}
                            />
                        }
                        subtitle={
                            <Translation
                                id="moduleTrading.tradingExchangeRevokeScreen.revokeSubtitle"
                                values={{ symbol: coinSymbol }}
                            />
                        }
                        closeActionType="back"
                    />
                }
                footer={
                    <ApprovalButton
                        isReady={isRevokeReady}
                        isDisabled={isDisabled}
                        flowType="revoke"
                    />
                }
            >
                <VStack spacing="sp12">
                    <ExchangeRevokeDetails exchange={quote.exchange} />
                </VStack>
            </Screen>
        );
    }

    if (!account) {
        return <RevokeErrorScreen />;
    }

    return (
        <ExchangeFlowStepsLayout
            approvalStatus="needs_revoke"
            currentStep="revoke"
            header={<ExchangeFlowScreenHeader />}
            footer={
                <ApprovalButton
                    isReady={isRevokeReady}
                    isDisabled={isDisabled}
                    flowType="revoke-and-approve"
                />
            }
        >
            <ExchangeFlowRevokeStepContent
                coinSymbol={coinSymbol}
                feeRow={<ExchangeFlowApprovalFeeSelectorRow accountKey={account.key} />}
            />
        </ExchangeFlowStepsLayout>
    );
};
