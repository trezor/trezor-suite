import { useSelector } from 'react-redux';

import { selectIsPortfolioTrackerDevice } from '@suite-common/wallet-core';
import { PortfolioTrackerInfo } from '@suite-native/trading-atoms';
import { selectIsTradingSellEnabled } from '@suite-native/trading-state';

import { SellTabContent } from './SellTabContent';
import { TradingTypeDisabled } from '../general/Error/TradingTypeDisabled';

const SellTabEnabled = () => {
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    if (isPortfolioTrackerDevice) {
        return <PortfolioTrackerInfo />;
    }

    return <SellTabContent />;
};

export const SellTab = () => {
    const isSellEnabled = useSelector(selectIsTradingSellEnabled);

    if (!isSellEnabled) {
        return <TradingTypeDisabled tradingType="sell" />;
    }

    return <SellTabEnabled />;
};
