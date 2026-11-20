import { memo } from 'react';
import { useSelector } from 'react-redux';

import { isFinalStatus, selectTradingExchangeSelectedQuote } from '@suite-common/trading';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useExchangeAnalyticsStepReport } from '@suite-native/trading-analytics';

import { ExchangePreviewContinueButton } from './ExchangePreviewContinueButton';
import { ExchangePreviewFooterContainer } from './ExchangePreviewFooterContainer';
import { useExchangeIssue } from '../../../hooks/exchange/useExchangeIssue';
import { useCloseTradingFlow } from '../../../hooks/general/useCloseTradingFlow';

export type ExchangePreviewFooterProps = {
    isContinueDisabled: boolean;
    onSignTransactionNavigation: () => void;
};

const BACK_TO_TRADE_FORM_BUTTON_TEST_ID = '@trading/exchange-preview/back-to-form-button';

export const ExchangePreviewFooter = memo(
    ({ isContinueDisabled, onSignTransactionNavigation }: ExchangePreviewFooterProps) => {
        const closeTradingFlow = useCloseTradingFlow();
        const reportToAnalytics = useExchangeAnalyticsStepReport('transaction-preview');

        const quote = useSelector(selectTradingExchangeSelectedQuote);
        const isTradeFinalized = isFinalStatus('exchange', quote?.status);
        const { issue, isSimulationEnabled } = useExchangeIssue();

        const shouldShowBackToTradeForm = isSimulationEnabled && issue && !isTradeFinalized;

        if (shouldShowBackToTradeForm) {
            return (
                <ExchangePreviewFooterContainer>
                    <Button
                        intent="neutral"
                        onPress={() => {
                            reportToAnalytics('cancel');
                            closeTradingFlow();
                        }}
                        testID={BACK_TO_TRADE_FORM_BUTTON_TEST_ID}
                    >
                        <Translation id="moduleTrading.transactionSimulation.backToTradeForm" />
                    </Button>
                </ExchangePreviewFooterContainer>
            );
        }

        return (
            <ExchangePreviewContinueButton
                isDisabled={isContinueDisabled}
                onSignTransactionNavigation={onSignTransactionNavigation}
            />
        );
    },
);
