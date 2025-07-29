import { useSelector } from 'react-redux';

import {
    selectIsDeviceInViewOnlyMode,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';

import { SellTabContent } from './SellTabContent';
import { selectIsTradingSellEnabled } from '../../selectors/commonSelectors';
import { PortfolioTrackerInfo } from '../general/Error/PorfolioTrackerInfo';
import { TradingTypeDisabled } from '../general/Error/TradingTypeDisabled';
import { ViewOnlyWalletInfo } from '../general/Error/ViewOnlyWalletInfo';

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
