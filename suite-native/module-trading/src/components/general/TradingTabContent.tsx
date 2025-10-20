import { useSelector } from 'react-redux';

import { useNetInfo } from '@react-native-community/netinfo';

import { DeviceOffline, NotAvailableInCountry } from '@suite-native/trading-atoms';

import { ActiveTab } from './ActiveTab';
import { useGeolocationCountryCode } from '../../hooks/general/useGeolocationCountryCode';
import { selectIsTradingBlacklisted } from '../../selectors/commonSelectors';

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
