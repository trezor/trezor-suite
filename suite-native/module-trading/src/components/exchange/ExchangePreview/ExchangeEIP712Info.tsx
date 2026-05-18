import { memo } from 'react';
import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { BulletListItem, Card, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeInfoHeader, TradeInfoRow } from '@suite-native/trading-atoms';

export type ExchangeEIP712InfoProps = {
    exchange?: string;
};

export const ExchangeEIP712Info = memo(({ exchange }: ExchangeEIP712InfoProps) => {
    const provider = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, exchange, 'exchange'),
    );
    const providerName = provider?.companyName ?? exchange ?? '';

    return (
        <Card noPadding>
            <TradeInfoHeader
                title={
                    <Translation
                        id="moduleTrading.tradingExchangePreviewScreen.eip712Info.title"
                        values={{ providerName }}
                    />
                }
            />
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
        </Card>
    );
});
