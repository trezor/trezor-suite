import { memo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { isFinalStatus, selectTradingExchangeSelectedQuote } from '@suite-common/trading';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    type RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { ExchangePreviewContinueButton } from './ExchangePreviewContinueButton';
import { ExchangePreviewFooterContainer } from './ExchangePreviewFooterContainer';
import { useExchangeIssue } from '../../../hooks/exchange/useExchangeIssue';

export type ExchangePreviewFooterProps = {
    isContinueDisabled: boolean;
    onSignTransactionNavigation: () => void;
};

type NavigationProp = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.TradingExchangePreview
>;

const BACK_TO_TRADE_FORM_BUTTON_TEST_ID = '@trading/exchange-preview/back-to-form-button';

export const ExchangePreviewFooter = memo(
    ({ isContinueDisabled, onSignTransactionNavigation }: ExchangePreviewFooterProps) => {
        const navigation = useNavigation<NavigationProp>();

        const quote = useSelector(selectTradingExchangeSelectedQuote);
        const isTradeFinalized = isFinalStatus('exchange', quote?.status);
        const { issue, isSimulationEnabled } = useExchangeIssue();

        const shouldShowBackToTradeForm = isSimulationEnabled && issue && !isTradeFinalized;

        if (shouldShowBackToTradeForm) {
            return (
                <ExchangePreviewFooterContainer>
                    <Button
                        intent="neutral"
                        onPress={navigation.popToTop}
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
