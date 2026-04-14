import { useSelector } from 'react-redux';

import type { BuyTrade } from 'invity-api';

import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { events } from '@suite-native/analytics';
import { Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { OverviewRow, OverviewValueSkeleton } from '@suite-native/trading-atoms';
import { selectBuyBestQuotesForAvailablePaymentMethods } from '@suite-native/trading-state';

import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useSheetControls } from '../../hooks/general/useSheetControls';
import { PaymentMethodSheet } from '../general/PaymentMethodSheet/PaymentMethodSheet';

const PAYMENT_METHOD_PICKER_TEST_ID = '@trading/buy/payment-method-picker';

type BuyPaymentMethodPickerRightProps = {
    isLoading: boolean;
    selectedValue: BuyTrade | undefined;
};

const BuyPaymentMethodPickerRight = ({
    isLoading,
    selectedValue,
}: BuyPaymentMethodPickerRightProps) => {
    const { translate } = useTranslate();

    if (isLoading) {
        return <OverviewValueSkeleton />;
    }

    if (selectedValue) {
        return (
            <Text
                color="contentSecondary"
                variant="body-sm"
                accessibilityLabel={translate('moduleTrading.tradingScreen.selectedPaymentMethod')}
                testID={PAYMENT_METHOD_PICKER_TEST_ID + '/value'}
            >
                {selectedValue.paymentMethodName}
            </Text>
        );
    }

    return (
        <Text
            color="contentDisabled"
            variant="body-sm"
            accessibilityLabel={translate('moduleTrading.tradingScreen.noPaymentMethod')}
        >
            <Translation id="moduleTrading.notSelected" />
        </Text>
    );
};

export const BuyPaymentMethodPicker = () => {
    const { translate } = useTranslate();
    const analytics = useAnalytics();
    const form = useBuyFormContext();
    const quotes = useSelector(selectBuyBestQuotesForAvailablePaymentMethods);
    const isLoading = useSelector(selectTradingBuyIsLoading);
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'quote');

    const shouldShowPicker = quotes.length > 0 || isLoading;

    if (!shouldShowPicker) {
        return null;
    }

    const showSheetConditionally = () => {
        if (!isLoading) {
            showSheet();
        }
    };

    const handleQuoteSelect = (quote: BuyTrade) => {
        setSelectedValue(quote);

        if (selectedValue?.paymentMethod === quote.paymentMethod) return;

        analytics.report({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'buy',
                parameter: 'paymentMethod',
            },
        });
    };

    return (
        <>
            <OverviewRow
                title={translate('moduleTrading.tradingScreen.paymentMethod')}
                onPress={showSheetConditionally}
                testID={PAYMENT_METHOD_PICKER_TEST_ID}
                noCaret={isLoading}
            >
                <BuyPaymentMethodPickerRight isLoading={isLoading} selectedValue={selectedValue} />
            </OverviewRow>
            <PaymentMethodSheet
                quotes={quotes}
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onQuoteSelect={handleQuoteSelect}
                selectedQuote={selectedValue}
                title={<Translation id="moduleTrading.tradingScreen.paymentMethod" />}
            />
        </>
    );
};
