import { useSelector } from 'react-redux';

import { selectActiveTradingType } from '@suite-native/trading-state';
import { exhaustive } from '@trezor/type-utils';

import { BuyTab } from '../buy/BuyTab';
import { ConciergeTab } from '../concierge/ConciergeTab';
import { ExchangeTab } from '../exchange/ExchangeTab';
import { SellTab } from '../sell/SellTab';

export const ActiveTab = () => {
    const activeTab = useSelector(selectActiveTradingType);

    switch (activeTab) {
        case 'buy':
            return <BuyTab />;

        case 'exchange':
            return <ExchangeTab />;

        case 'sell':
            return <SellTab />;

        case 'concierge':
            return <ConciergeTab />;

        case undefined:
            return null;

        default:
            exhaustive(activeTab);
    }
};
