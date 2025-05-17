import { useSelector } from 'react-redux';

import { BuyTrade } from 'invity-api';

import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { EventType, analytics } from '@suite-native/analytics';
import { Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useTradingBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useTradeSheetControls } from '../../hooks/general/useSheetControls';
import { selectBuyBestQuotesForAvailablePaymentMethods } from '../../selectors/buySelectors';
import { TradingOverviewRow } from '../general/OverviewRow';
import { TradingOverviewValueSkeleton } from '../general/OverviewValueSkeleton';
import { PaymentMethodsSheet } from '../general/PaymentMethodSheet/PaymentMethodSheet';

const PAYMENT_METHOD_PICKER_TEST_ID = '@trading/buy/payment-method-picker';

export const PaymentMethodPicker = () => {
    const { translate } = useTranslate();
    const form = useTradingBuyFormContext();
    const quotes = useSelector(selectBuyBestQuotesForAvailablePaymentMethods);
    const isLoading = useSelector(selectTradingBuyIsLoading);
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useTradeSheetControls(form, 'quote');

    if (isLoading) {
        return (
            <TradingOverviewRow
                title={translate('moduleTrading.tradingScreen.paymentMethod')}
                noCaret
            >
                <TradingOverviewValueSkeleton />
            </TradingOverviewRow>
        );
    }

    if (quotes.length === 0) {
        return null;
    }

    const handleQuoteSelect = (quote: BuyTrade) => {
        setSelectedValue(quote);

        if (selectedValue?.paymentMethod === quote.paymentMethod) return;

        analytics.report({
            type: EventType.TradingParameterChanged,
            payload: {
                type: 'buy',
                parameter: 'paymentMethod',
            },
        });
    };

    return (
        <>
            <TradingOverviewRow
                title={translate('moduleTrading.tradingScreen.paymentMethod')}
                onPress={showSheet}
                testID={PAYMENT_METHOD_PICKER_TEST_ID}
            >
                {selectedValue ? (
                    <Text
                        color="textSubdued"
                        variant="body"
                        accessibilityLabel={translate(
                            'moduleTrading.tradingScreen.selectedPaymentMethod',
                        )}
                        testID={PAYMENT_METHOD_PICKER_TEST_ID + '/value'}
                    >
                        {selectedValue.paymentMethodName}
                    </Text>
                ) : (
                    <Text
                        color="textDisabled"
                        variant="body"
                        accessibilityLabel={translate(
                            'moduleTrading.tradingScreen.noPaymentMethod',
                        )}
                    >
                        {translate('moduleTrading.notSelected')}
                    </Text>
                )}
            </TradingOverviewRow>
            <PaymentMethodsSheet
                quotes={quotes}
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onQuoteSelect={handleQuoteSelect}
                selectedQuote={selectedValue}
            />
        </>
    );
};
