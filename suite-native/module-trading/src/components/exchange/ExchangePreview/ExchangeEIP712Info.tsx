import { type PropsWithChildren } from 'react';

import { BulletListItem, Card, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';

import { ProviderInfoRow } from '../../general/TradeInfo/ProviderInfoRow';

export type ExchangeEIP712InfoProps = {
    exchange?: string;
} & PropsWithChildren;

export const ExchangeEIP712Info = ({ exchange, children }: ExchangeEIP712InfoProps) => (
    <Card noPadding testID="@trading/exchange-preview/eip712-info">
        <ProviderInfoRow exchange={exchange} tradingType="exchange" noBorder />
        <TradeInfoRow>
            <VStack>
                <BulletListItem variant="body-sm">
                    <Translation id="moduleTrading.tradingExchangePreviewScreen.eip712Info.bullet1" />
                </BulletListItem>
                <BulletListItem variant="body-sm">
                    <Translation id="moduleTrading.tradingExchangePreviewScreen.eip712Info.bullet2" />
                </BulletListItem>
                <BulletListItem variant="body-sm">
                    <Translation id="moduleTrading.tradingExchangePreviewScreen.eip712Info.bullet3" />
                </BulletListItem>
            </VStack>
        </TradeInfoRow>
        {children}
    </Card>
);
