import { useSelector } from 'react-redux';

import { BuyTrade } from 'invity-api';

import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { EventType, analytics } from '@suite-native/analytics';
import { Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useSheetControls } from '../../hooks/general/useSheetControls';
import { selectBuyBestQuotesForAvailablePaymentMethods } from '../../selectors/buySelectors';
import { OverviewRow } from '../general/OverviewRow';
import { OverviewValueSkeleton } from '../general/OverviewValueSkeleton';
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
                color="textSubdued"
                variant="body"
                accessibilityLabel={translate('moduleTrading.tradingScreen.selectedPaymentMethod')}
                testID={PAYMENT_METHOD_PICKER_TEST_ID + '/value'}
            >
                {selectedValue.paymentMethodName}
            </Text>
        );
    }

    return (
        <Text
            color="textDisabled"
            variant="body"
            accessibilityLabel={translate('moduleTrading.tradingScreen.noPaymentMethod')}
        >
            {translate('moduleTrading.notSelected')}
        </Text>
    );
};

export const BuyPaymentMethodPicker = () => {
    const { translate } = useTranslate();
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
            type: EventType.TradingParameterChanged,
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
            />
        </>
    );
};
