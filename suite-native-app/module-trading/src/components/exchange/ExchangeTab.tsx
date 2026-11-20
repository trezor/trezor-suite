import { useSelector } from 'react-redux';

import { selectHasBitcoinOnlyFirmware, selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { BtcOnlyFirmwareInfo, PortfolioTrackerInfo } from '@suite-native/trading-atoms';
import { selectIsTradingExchangeEnabled } from '@suite-native/trading-state';

import { ExchangeTabContent } from './ExchangeTabContent';
import { TradingTypeDisabled } from '../general/Error/TradingTypeDisabled';

const ExchangeTabEnabled = () => {
    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    if (isPortfolioTrackerDevice) {
        return <PortfolioTrackerInfo testID="@trading/exchange/portfolio-tracker-info" />;
    }

    if (hasBitcoinOnlyFirmware) {
        return <BtcOnlyFirmwareInfo />;
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
