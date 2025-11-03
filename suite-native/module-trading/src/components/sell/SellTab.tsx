import { useSelector } from 'react-redux';

import {
    selectIsDeviceInViewOnlyMode,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { PortfolioTrackerInfo, ViewOnlyWalletInfo } from '@suite-native/trading-atoms';
import { selectIsTradingSellEnabled } from '@suite-native/trading-state';

import { SellTabContent } from './SellTabContent';
import { TradingTypeDisabled } from '../general/Error/TradingTypeDisabled';

const SellTabEnabled = () => {
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    if (isPortfolioTrackerDevice) {
        return <PortfolioTrackerInfo />;
    }

    if (isDeviceInViewOnlyMode) {
        return <ViewOnlyWalletInfo />;
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
