import type { SellFiatTrade } from 'invity-api';

import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { TradingPreviewInfoCard } from '../../general/TradingPreview/TradingPreviewInfoCard';
import { SellFromAccountCard } from '../SellFromAccountCard';

export type SellPreviewViewProps = {
    quote: SellFiatTrade;
};

export const SellPreviewView = ({ quote }: SellPreviewViewProps) => (
    <VStack spacing="sp16">
        <SellFromAccountCard quote={quote} />
        <TradingPreviewInfoCard
            quote={quote}
            tradingType="sell"
            fiatAmountLabel={<Translation id="moduleTrading.tradingSellPreviewScreen.youGet" />}
        />
    </VStack>
);
