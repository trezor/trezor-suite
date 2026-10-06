import type { BuyTrade } from 'invity-api';

import { Translation } from '@suite-native/intl';

import { TradingPreviewInfoCard } from '../../general/TradingPreview/TradingPreviewInfoCard';

export type BuyPreviewInfoCardProps = {
    quote: BuyTrade;
};

export const BuyPreviewInfoCard = ({ quote }: BuyPreviewInfoCardProps) => (
    <TradingPreviewInfoCard
        quote={quote}
        tradingType="buy"
        fiatAmountLabel={<Translation id="moduleTrading.tradingBuyPreviewScreen.youPay" />}
    />
);
