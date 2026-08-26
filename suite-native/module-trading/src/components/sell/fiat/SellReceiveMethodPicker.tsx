import { StretchInY, StretchOutY } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import type { SellFiatTrade } from 'invity-api';

import { useServices } from '@suite-common/dependency-injection';
import { selectTradingSellIsLoading } from '@suite-common/trading';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { AnimatedBox, Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    OverviewRow,
    OverviewValueSkeleton,
    PaymentMethodDisplay,
} from '@suite-native/trading-atoms';
import { selectSellBestQuotesForAvailablePaymentMethods } from '@suite-native/trading-state';

import { useSheetControls } from '../../../hooks/general/useSheetControls';
import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { PaymentMethodSheet } from '../../general/PaymentMethodSheet/PaymentMethodSheet';

const RECEIVE_METHOD_PICKER_TEST_ID = '@trading/sell/receive-method-picker';

type SellReceiveMethodPickerRightProps = {
    isLoading: boolean;
    selectedValue: SellFiatTrade | undefined;
};

const SellReceiveMethodPickerRight = ({
    isLoading,
    selectedValue,
}: SellReceiveMethodPickerRightProps) => {
    const { translate } = useTranslate();

    if (isLoading) {
        return <OverviewValueSkeleton />;
    }

    if (selectedValue) {
        return (
            <PaymentMethodDisplay
                paymentMethod={selectedValue.paymentMethod}
                paymentMethodName={selectedValue.paymentMethodName}
                accessibilityLabel={translate('moduleTrading.tradingScreen.selectedReceiveMethod')}
                testID={RECEIVE_METHOD_PICKER_TEST_ID + '/value'}
            />
        );
    }

    return (
        <Text
            color="contentSecondary"
            variant="body-sm"
            accessibilityLabel={translate('moduleTrading.tradingScreen.noReceiveMethod')}
            testID={RECEIVE_METHOD_PICKER_TEST_ID + '/value'}
        >
            <Translation id="moduleTrading.notSelected" />
        </Text>
    );
};

export const SellReceiveMethodPicker = () => {
    const { translate } = useTranslate();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const form = useSellFormContext();
    const quotes = useSelector(selectSellBestQuotesForAvailablePaymentMethods);
    const isLoading = useSelector(selectTradingSellIsLoading);
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

    const handleQuoteSelect = (quote: SellFiatTrade) => {
        setSelectedValue(quote);

        if (selectedValue?.paymentMethod === quote.paymentMethod) return;

        analytics.report({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'sell',
                parameter: 'paymentMethod',
            },
        });
    };

    return (
        <>
            <AnimatedBox entering={StretchInY} exiting={StretchOutY}>
                <OverviewRow
                    title={translate('moduleTrading.tradingScreen.receiveMethod')}
                    onPress={showSheetConditionally}
                    testID={RECEIVE_METHOD_PICKER_TEST_ID}
                    noCaret={isLoading}
                >
                    <SellReceiveMethodPickerRight
                        isLoading={isLoading}
                        selectedValue={selectedValue}
                    />
                </OverviewRow>
            </AnimatedBox>
            <PaymentMethodSheet
                quotes={quotes}
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onQuoteSelect={handleQuoteSelect}
                selectedQuote={selectedValue}
                title={<Translation id="moduleTrading.tradingScreen.receiveMethod" />}
            />
        </>
    );
};
