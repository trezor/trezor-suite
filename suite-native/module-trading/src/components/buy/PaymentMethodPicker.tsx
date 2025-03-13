import { useMemo } from 'react';

import { BuyTrade, CryptoId } from 'invity-api';

import { TradingPaymentMethodListProps, getTradingPaymentMethods } from '@suite-common/trading';
import { HStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { PaymentMethodsSheet } from '../general/PaymentMethodsSheet/PaymentMethodsSheet';
import { TradingOverviewRow } from '../general/TradingOverviewRow';

const bitcoin = 'bitcoin' as CryptoId;

const mockedQuotes: BuyTrade[] = [
    {
        fiatStringAmount: '10',
        fiatCurrency: 'EUR',
        receiveCurrency: bitcoin,
        receiveStringAmount: '0.0005',
        rate: 20000,
        quoteId: 'fc12d4c4-9078-4175-becd-90fc58a3145c',
        error: 'Amount too low, minimum is EUR 25 or BTC 0.002.',
        exchange: 'cexdirect',
        minFiat: 25,
        maxFiat: 1000,
        minCrypto: 0.002,
        maxCrypto: 0.10532,
        paymentMethod: 'creditCard',
        paymentMethodName: 'Credit Card',
        paymentId: 'e709df77-ee9e-4d12-98c2-84004a19c546',
    },
    {
        fiatStringAmount: '10',
        fiatCurrency: 'EUR',
        receiveCurrency: bitcoin,
        receiveStringAmount: '0.0010001683607972866',
        rate: 9998.316675433,
        quoteId: 'ff259797-6cbe-4fea-8330-5181353f64a0',
        exchange: 'mercuryo',
        minFiat: 20,
        maxFiat: 1999.96,
        minCrypto: 0.002,
        maxCrypto: 0.20003,
        paymentMethod: 'applePay',
        paymentMethodName: 'Apple Pay',
        paymentId: 'e709df77-ee9e-4d12-98c2-84004a19c521',
    },
    {
        fiatStringAmount: '10',
        fiatCurrency: 'EUR',
        receiveCurrency: bitcoin,
        receiveStringAmount: '0',
        rate: 0,
        error: 'Transaction amount too low. Please enter a value of 43 EUR or more.',
        exchange: 'simplex',
        minFiat: 43,
        maxFiat: 17044,
        minCrypto: 0.00415525,
        maxCrypto: 1.66210137,
    },
];

export const PaymentMethodPicker = () => {
    const { translate } = useTranslate();

    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useTradeSheetControls<TradingPaymentMethodListProps>();

    const methods = useMemo(() => getTradingPaymentMethods(mockedQuotes), []);

    return (
        <>
            <TradingOverviewRow
                title={translate('moduleTrading.tradingScreen.paymentMethod')}
                onPress={showSheet}
            >
                {selectedValue ? (
                    <HStack>
                        <Text color="textSubdued" variant="body">
                            {selectedValue.label}
                        </Text>
                    </HStack>
                ) : (
                    <Text color="textDisabled" variant="body">
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
