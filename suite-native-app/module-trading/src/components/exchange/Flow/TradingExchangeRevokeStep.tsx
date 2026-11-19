import { BannerInline, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type ExchangeFlowApprovalStatus, Screen, ScreenHeader } from '@suite-native/navigation';
import { CurrentStepCardHeader } from '@suite-native/step-cards';

import { ExchangeFlowScreenHeader } from './ExchangeFlowScreenHeader';
import { ExchangeFlowStepsLayout } from './ExchangeFlowStepsLayout';
import { useExchangeRevokeStep } from '../../../hooks/exchange/Approval/useExchangeRevokeStep';
import { ApprovalButton } from '../Approval/ApprovalButton';
import { ExchangeRevokeDetails } from '../Approval/ExchangeRevokeDetails';

export type TradingExchangeRevokeStepProps = {
    approvalStatus: ExchangeFlowApprovalStatus;
};

export const TradingExchangeRevokeStep = ({ approvalStatus }: TradingExchangeRevokeStepProps) => {
    const { quote, coinSymbol, isRevokeReady, isDisabled } = useExchangeRevokeStep();

    if (!quote) {
        return (
            <Screen header={<ScreenHeader closeActionType="back" />}>
                <BannerInline
                    title={
                        <Translation id="moduleTrading.tradingExchangeRevokeScreen.revokeErrorAlert" />
                    }
                    intent="critical"
                />
            </Screen>
        );
    }

    return (
        <ExchangeFlowStepsLayout
            approvalStatus={approvalStatus}
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
            <CurrentStepCardHeader>
                <Text variant="headline-sm">
                    <Translation
                        id="moduleTrading.tradingExchangeRevokeScreen.revokeTitle"
                        values={{ symbol: coinSymbol }}
                    />
                </Text>
                <BannerInline
                    intent="info"
                    title={
                        <Translation id="moduleTrading.tradingExchangeRevokeScreen.lowLimitInfoAlert" />
                    }
                />
            </CurrentStepCardHeader>
            <VStack spacing="sp12" paddingHorizontal="sp16" paddingBottom="sp16">
                <ExchangeRevokeDetails exchange={quote.exchange} />
            </VStack>
        </ExchangeFlowStepsLayout>
    );
};
