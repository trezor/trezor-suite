import { StretchInY, StretchOutY } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import type { SellFiatTrade } from 'invity-api';

import { selectTradingSellIsLoading } from '@suite-common/trading';
import { events } from '@suite-native/analytics';
import { AnimatedBox, Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { OverviewRow, OverviewValueSkeleton } from '@suite-native/trading-atoms';
import { selectSellBestQuotesForAvailablePaymentMethods } from '@suite-native/trading-state';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useSheetControls } from '../../../hooks/general/useSheetControls';
import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { PaymentMethodSheet } from '../../general/PaymentMethodSheet/PaymentMethodSheet';

const RECEIVE_METHOD_PICKER_TEST_ID = '@trading/sell/receive-method-picker';

type SellReceiveMethodPickerRightProps = {
    isLoading: boolean;
    selectedValue: SellFiatTrade | undefined;
};

const pickerStyle = prepareNativeStyle(({ borders, colors }) => ({
    borderTopWidth: borders.widths.small,
    borderTopColor: colors.backgroundSurfaceElevation0,
}));

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
            <Text
                color="textSubdued"
                variant="body-sm"
                accessibilityLabel={translate('moduleTrading.tradingScreen.selectedReceiveMethod')}
                testID={RECEIVE_METHOD_PICKER_TEST_ID + '/value'}
            >
                {selectedValue.paymentMethodName}
            </Text>
        );
    }

    return (
        <Text
            color="textSubdued"
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
    const analytics = useAnalytics();
    const { applyStyle } = useNativeStyles();
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
            <AnimatedBox
                style={applyStyle(pickerStyle)}
                entering={StretchInY}
                exiting={StretchOutY}
            >
                <OverviewRow
                    title={translate('moduleTrading.tradingScreen.receiveMethod')}
                    onPress={showSheetConditionally}
                    testID={RECEIVE_METHOD_PICKER_TEST_ID}
                    noCaret={isLoading}
                    noBottomBorder
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
