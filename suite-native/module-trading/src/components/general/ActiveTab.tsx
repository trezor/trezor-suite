import { useSelector } from 'react-redux';

import { exhaustive } from '@trezor/type-utils';

import { selectActiveTradingType } from '../../selectors/commonSelectors';
import { BuyTab } from '../buy/BuyTab';
import { ExchangeTab } from '../exchange/ExchangeTab';

export const ActiveTab = () => {
    const activeTab = useSelector(selectActiveTradingType);

    switch (activeTab) {
        case 'buy':
            return <BuyTab />;

        case 'exchange':
            return <ExchangeTab />;

        case 'sell':
            // Sell is not implemented yet
            return null;

        default:
            exhaustive(activeTab);
    }
};
