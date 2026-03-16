import { type ReactNode } from 'react';

import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeInfoHeader, TradeInfoRow } from '@suite-native/trading-atoms';
import type { ExtendedSellCryptoPaymentMethod } from '@suite-native/trading-types';

import { FiatCurrencyIcon } from '../FiatCurrencyIcon';

export type TradeFiatSideCardProps = {
    paymentMethod: ExtendedSellCryptoPaymentMethod;
    amount: ReactNode;
    title: ReactNode;
};
const paymentMethodNamesMap: Record<ExtendedSellCryptoPaymentMethod, ReactNode> = {
    bankTransfer: (
        <Translation id="moduleTrading.tradingSellPreviewScreen.paymentMethods.bankTransfer" />
    ),
    creditCard: (
        <Translation id="moduleTrading.tradingSellPreviewScreen.paymentMethods.creditCard" />
    ),
    sepa: <Translation id="moduleTrading.tradingSellPreviewScreen.paymentMethods.sepa" />,
    ach: <Translation id="moduleTrading.tradingSellPreviewScreen.paymentMethods.ach" />,
    skrill: <Translation id="moduleTrading.tradingSellPreviewScreen.paymentMethods.skrill" />,

    neteller: <Translation id="moduleTrading.tradingSellPreviewScreen.paymentMethods.neteller" />,
    payid: <Translation id="moduleTrading.tradingSellPreviewScreen.paymentMethods.payid" />,
    dcinterac: <Translation id="moduleTrading.tradingSellPreviewScreen.paymentMethods.dcinterac" />,
    fasterPayment: (
        <Translation id="moduleTrading.tradingSellPreviewScreen.paymentMethods.fasterPayment" />
    ),
};

const getPaymentMethodTranslation = (paymentMethod: ExtendedSellCryptoPaymentMethod | string) => {
    if (paymentMethod in paymentMethodNamesMap) {
        return paymentMethodNamesMap[paymentMethod as ExtendedSellCryptoPaymentMethod];
    }

    return paymentMethod;
};

export const TradeFiatSideCard = ({ paymentMethod, amount, title }: TradeFiatSideCardProps) => (
    <Card noPadding>
        <TradeInfoHeader
            title={title}
            rightContent={
                <Text variant="body-sm">{getPaymentMethodTranslation(paymentMethod)}</Text>
            }
        />
        <TradeInfoRow>
            <HStack alignItems="center">
                <FiatCurrencyIcon size="small" />
                <VStack spacing="sp2">{amount}</VStack>
            </HStack>
        </TradeInfoRow>
    </Card>
);
