import { useSelector } from 'react-redux';

import { useNetInfo } from '@react-native-community/netinfo';

import { DeviceOffline, NotAvailableInCountry } from '@suite-native/trading-atoms';
import { selectIsTradingBlacklisted } from '@suite-native/trading-state';

import { ActiveTab } from './ActiveTab';
import { useGeolocationCountryCode } from '../../hooks/general/useGeolocationCountryCode';

export const TradingTabContent = () => {
    const { isInternetReachable } = useNetInfo();
    const isTradingBlacklisted = useSelector(selectIsTradingBlacklisted);
    useGeolocationCountryCode();

    if (isTradingBlacklisted) {
        return <NotAvailableInCountry />;
    }

    if (isInternetReachable === false) {
        return <DeviceOffline />;
    }

    return <ActiveTab />;
};
