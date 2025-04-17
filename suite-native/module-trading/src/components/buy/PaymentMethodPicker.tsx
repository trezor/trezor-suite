import { useSelector } from 'react-redux';

import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { selectBuyBestQuotesForAvailablePaymentMethods } from '../../selectors/buySelectors';
import { PaymentMethodsSheet } from '../general/PaymentMethodsSheet/PaymentMethodsSheet';
import { TradingOverviewRow } from '../general/TradingOverviewRow';
import { TradingOverviewValueSkeleton } from '../general/TradingOverviewValueSkeleton';

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

    return (
        <>
            <TradingOverviewRow
                title={translate('moduleTrading.tradingScreen.paymentMethod')}
                onPress={showSheet}
            >
                {selectedValue ? (
                    <Text
                        color="textSubdued"
                        variant="body"
                        accessibilityLabel={translate(
                            'moduleTrading.tradingScreen.selectedPaymentMethod',
                        )}
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
                onQuoteSelect={setSelectedValue}
                selectedQuote={selectedValue}
            />
        </>
    );
};
