import { useSelector } from 'react-redux';

import {
    selectHasBitcoinOnlyFirmware,
    selectIsDeviceInViewOnlyMode,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';

import { ExchangeTabContent } from './ExchangeTabContent';
import { selectIsTradingExchangeEnabled } from '../../selectors/commonSelectors';
import { BtcOnlyFirmwareInfo } from '../general/Error/BtcOnlyFirmwareInfo';
import { PortfolioTrackerInfo } from '../general/Error/PorfolioTrackerInfo';
import { TradingTypeDisabled } from '../general/Error/TradingTypeDisabled';
import { ViewOnlyWalletInfo } from '../general/Error/ViewOnlyWalletInfo';

const ExchangeTabEnabled = () => {
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    if (isPortfolioTrackerDevice) {
        return <PortfolioTrackerInfo />;
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
