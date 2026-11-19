import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type ExchangeFlowApprovalStatus } from '@suite-native/navigation';
import { CurrentStepCardHeader } from '@suite-native/step-cards';
import { Footer } from '@suite-native/trading-provider-utils';

import { ExchangeFlowStepsLayout } from './ExchangeFlowStepsLayout';
import { useExchangePreviewStep } from '../../../hooks/exchange/useExchangePreviewStep';
import { ExchangePreviewFooter } from '../ExchangePreview/ExchangePreviewFooter';
import { ExchangePreviewScreenHeader } from '../ExchangePreview/ExchangePreviewScreenHeader';
import { ExchangePreviewView } from '../ExchangePreview/ExchangePreviewView';

export type TradingExchangePreviewStepProps = {
    approvalStatus: ExchangeFlowApprovalStatus;
    onApprovalRequired: () => void;
};

export const TradingExchangePreviewStep = ({
    approvalStatus,
    onApprovalRequired,
}: TradingExchangePreviewStepProps) => {
    const { quote, errorString, handleConfirmTrade, onSignTransactionNavigation } =
        useExchangePreviewStep({ onApprovalRequired });

    return (
        <ExchangeFlowStepsLayout
            approvalStatus={approvalStatus}
            currentStep="preview"
            header={<ExchangePreviewScreenHeader />}
            footer={
                <ExchangePreviewFooter
                    isContinueDisabled={!!errorString}
                    onSignTransactionNavigation={onSignTransactionNavigation}
                />
            }
        >
            <CurrentStepCardHeader>
                <Text variant="headline-sm">
                    <Translation id="moduleTrading.tradingExchangePreviewScreen.title" />
                </Text>
            </CurrentStepCardHeader>
            <VStack spacing="sp16" paddingHorizontal="sp16" paddingBottom="sp16">
                {/* The preview step always follows a finished approval in this flow. */}
                <ExchangePreviewView
                    quote={quote}
                    txnErrorString={errorString}
                    onSignTransactionNavigation={onSignTransactionNavigation}
                    onSlippageConfirmed={handleConfirmTrade}
                    isApproved
                />
                <Footer />
            </VStack>
        </ExchangeFlowStepsLayout>
    );
};
