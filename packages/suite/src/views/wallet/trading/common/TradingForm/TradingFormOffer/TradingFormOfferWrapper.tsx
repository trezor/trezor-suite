import { exhaustive } from '@trezor/type-utils';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';

import { TradingFormBuyOffer } from '../../../buy/TradingFormBuyOffer';
import { TradingFormExchangeOffer } from '../../../exchange/TradingFormExchangeOffer';
import { TradingFormSellOffer } from '../../../sell/TradingFormSellOffer';

export const TradingFormOfferWrapper = () => {
    const { type } = useTradingFormContext();

    switch (type) {
        case 'buy':
            return <TradingFormBuyOffer />;
        case 'sell':
            return <TradingFormSellOffer />;
        case 'exchange':
            return <TradingFormExchangeOffer />;
        default:
            return exhaustive(type);
    }
};
