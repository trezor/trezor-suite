import { ReactNode } from 'react';

import type { SellCryptoPaymentMethod } from 'invity-api';

import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { exhaustive } from '@trezor/type-utils';

import { FiatCurrencyIcon } from './FiatCurrencyIcon';
import { TradeInfoHeader } from '../TradeInfo/TradeInfoHeader';
import { TradeInfoRow } from '../TradeInfo/TradeInfoRow';

export type TradeFiatSideCardProps = {
    paymentMethod: SellCryptoPaymentMethod;
    amount: ReactNode;
    title: ReactNode;
};

const getPaymentMethodTranslation = (paymentMethod: SellCryptoPaymentMethod) => {
    switch (paymentMethod) {
        case 'bankTransfer':
            return (
                <Translation id="moduleTrading.tradingSellPreviewScreen.paymentMethods.bankTransfer" />
            );
        case 'creditCard':
            return (
                <Translation id="moduleTrading.tradingSellPreviewScreen.paymentMethods.creditCard" />
            );
        default:
            exhaustive(paymentMethod);
    }
};

export const TradeFiatSideCard = ({ paymentMethod, amount, title }: TradeFiatSideCardProps) => (
    <Card noPadding>
        <TradeInfoHeader title={title} />
        <TradeInfoRow>
            <Text variant="hint">{getPaymentMethodTranslation(paymentMethod)}</Text>
        </TradeInfoRow>

        <TradeInfoRow>
            <HStack alignItems="center">
                <FiatCurrencyIcon size="small" />
                <VStack spacing="sp2">{amount}</VStack>
            </HStack>
        </TradeInfoRow>
    </Card>
);
