import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import { useTranslate } from '@suite-native/intl';
import { BtcOnlyCoinEnablingContent, DiscoveryCoinsFilter } from '@suite-native/coin-enabling';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/wallet-core';
import {
    selectDiscoveryNetworkSymbols,
    selectEnabledDiscoveryNetworkSymbols,
    setEnabledDiscoveryNetworkSymbols,
    setIsCoinEnablingInitFinished,
} from '@suite-native/discovery';
import { selectViewOnlyDevicesAccountsNetworkSymbols } from '@suite-native/device';

export const SettingsCoinEnablingScreen = () => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();

    const enabledNetworkSymbols = useSelector(selectEnabledDiscoveryNetworkSymbols);
    const availableNetworkSymbols = useSelector(selectDiscoveryNetworkSymbols);
    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const viewOnlyDevicesAccountsNetworkSymbols = useSelector(
        selectViewOnlyDevicesAccountsNetworkSymbols,
    );

    //testnets can be enabled and we want to show networks that case
    const showNetworks = availableNetworkSymbols.length > 1 || !hasBitcoinOnlyFirmware;

    useEffect(() => {
        // in case the user has view only devices and gets to the settings
        // before the Coin Enabling has been initialized, we need to set the networks
        if (enabledNetworkSymbols.length === 0) {
            dispatch(setEnabledDiscoveryNetworkSymbols(viewOnlyDevicesAccountsNetworkSymbols));
        }
    }, [enabledNetworkSymbols.length, dispatch, viewOnlyDevicesAccountsNetworkSymbols]);

    useFocusEffect(
        useCallback(() => {
            // mark coin init as finished if there are enabled coins on leaving the screen
            return () => {
                if (enabledNetworkSymbols.length > 0) {
                    dispatch(setIsCoinEnablingInitFinished(true));
                }
            };
        }, [dispatch, enabledNetworkSymbols.length]),
    );

    return (
        <Screen
            screenHeader={
                <ScreenSubHeader
                    content={translate('moduleSettings.coinEnabling.settings.title')}
                />
            }
        >
            {showNetworks ? <DiscoveryCoinsFilter /> : <BtcOnlyCoinEnablingContent />}
        </Screen>
    );
};
