import { memo } from 'react';

import { BulletListItem, Card, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeInfoHeader, TradeInfoRow } from '@suite-native/trading-atoms';

export const ExchangeFusionPlusInfo = memo(() => (
    <Card noPadding>
        <TradeInfoHeader
            title={
                <Translation id="moduleTrading.tradingExchangePreviewScreen.fusionPlusInfo.title" />
            }
        />
        <TradeInfoRow>
            <VStack>
                <BulletListItem variant="body-sm">
                    <Translation id="moduleTrading.tradingExchangePreviewScreen.fusionPlusInfo.bullet1" />
                </BulletListItem>
                <BulletListItem variant="body-sm">
                    <Translation id="moduleTrading.tradingExchangePreviewScreen.fusionPlusInfo.bullet2" />
                </BulletListItem>
                <BulletListItem variant="body-sm">
                    <Translation id="moduleTrading.tradingExchangePreviewScreen.fusionPlusInfo.bullet3" />
                </BulletListItem>
            </VStack>
        </TradeInfoRow>
    </Card>
));
