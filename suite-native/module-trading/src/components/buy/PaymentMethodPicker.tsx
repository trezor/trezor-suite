import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    getTradingPaymentMethods,
    selectTradingBuyIsLoading,
    selectTradingBuyQuotes,
} from '@suite-common/trading';
import { Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { PaymentMethodsSheet } from '../general/PaymentMethodsSheet/PaymentMethodsSheet';
import { TradingOverviewRow } from '../general/TradingOverviewRow';
import { TradingOverviewValueSkeleton } from '../general/TradingOverviewValueSkeleton';

export const PaymentMethodPicker = () => {
    const { translate } = useTranslate();
    const form = useTradingBuyFormContext();
    const quotes = useSelector(selectTradingBuyQuotes);
    const isLoading = useSelector(selectTradingBuyIsLoading);
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useTradeSheetControls(form, 'paymentMethod');

    const methods = useMemo(() => getTradingPaymentMethods(quotes), [quotes]);

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

    if (methods.length === 0) {
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
                        {selectedValue.label}
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
                methods={methods}
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onMethodSelect={setSelectedValue}
                selectedMethod={selectedValue}
            />
        </>
    );
};
