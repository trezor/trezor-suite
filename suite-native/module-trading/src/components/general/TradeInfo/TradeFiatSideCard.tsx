import { type ReactNode } from 'react';

import { type FiatCurrencyCode } from 'invity-api';

import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import {
    PaymentMethodTranslation,
    TradeInfoHeader,
    TradeInfoRow,
} from '@suite-native/trading-atoms';
import type { ExtendedSellCryptoPaymentMethod } from '@suite-native/trading-types';

import { FiatCurrencyIcon } from '../FiatCurrencyIcon';

export type TradeFiatSideCardProps = {
    paymentMethod: ExtendedSellCryptoPaymentMethod;
    paymentMethodName?: string;
    amount: ReactNode;
    title: ReactNode;
    fiatCurrency: FiatCurrencyCode;
};

export const TradeFiatSideCard = ({
    paymentMethod,
    amount,
    title,
    fiatCurrency,
    paymentMethodName,
}: TradeFiatSideCardProps) => (
    <Card noPadding>
        <TradeInfoHeader
            title={title}
            rightContent={
                <Text variant="body-sm">
                    <PaymentMethodTranslation
                        paymentMethod={paymentMethod}
                        paymentMethodName={paymentMethodName}
                    />
                </Text>
            }
        />
        <TradeInfoRow>
            <HStack alignItems="center">
                <FiatCurrencyIcon size="extraSmall" value={fiatCurrency} />
                <VStack spacing="sp2">{amount}</VStack>
            </HStack>
        </TradeInfoRow>
    </Card>
);
