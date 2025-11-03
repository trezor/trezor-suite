import { useSelector } from 'react-redux';

import {
    selectHasBitcoinOnlyFirmware,
    selectIsDeviceInViewOnlyMode,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import {
    BtcOnlyFirmwareInfo,
    PortfolioTrackerInfo,
    ViewOnlyWalletInfo,
} from '@suite-native/trading-atoms';
import { selectIsTradingExchangeEnabled } from '@suite-native/trading-state';

import { ExchangeTabContent } from './ExchangeTabContent';
import { TradingTypeDisabled } from '../general/Error/TradingTypeDisabled';

const ExchangeTabEnabled = () => {
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    if (isPortfolioTrackerDevice) {
        return <PortfolioTrackerInfo testID="@trading/exchange/portfolio-tracker-info" />;
    }

    if (hasBitcoinOnlyFirmware) {
        return <BtcOnlyFirmwareInfo />;
    }

    if (isDeviceInViewOnlyMode) {
        return <ViewOnlyWalletInfo />;
    }

    return <ExchangeTabContent />;
};

export const ExchangeTab = () => {
    const isExchangeEnabled = useSelector(selectIsTradingExchangeEnabled);

    if (!isExchangeEnabled) {
        return <TradingTypeDisabled tradingType="exchange" />;
    }

    return <ExchangeTabEnabled />;
};
