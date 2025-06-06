import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    changeNetworks,
    selectEnabledNetworks,
    selectHasBitcoinOnlyFirmware,
} from '@suite-common/wallet-core';
import { BtcOnlyCoinEnablingContent, DiscoveryCoinsFilter } from '@suite-native/coin-enabling';
import { selectViewOnlyDevicesAccountsNetworkSymbols } from '@suite-native/device';
import { selectDiscoveryNetworkSymbols } from '@suite-native/discovery';
import { useTranslate } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { setIsCoinEnablingInitFinished } from '@suite-native/settings';

export const SettingsCoinEnablingScreen = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { translate } = useTranslate();

    const enabledNetworkSymbols = useSelector(selectEnabledNetworks);
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
            dispatch(changeNetworks(viewOnlyDevicesAccountsNetworkSymbols));
        }
    }, [enabledNetworkSymbols.length, dispatch, viewOnlyDevicesAccountsNetworkSymbols]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('blur', () => {
            if (enabledNetworkSymbols.length > 0) {
                dispatch(setIsCoinEnablingInitFinished(true));
            }
        });

        return unsubscribe;
    }, [navigation, enabledNetworkSymbols.length, dispatch]);

    return (
        <Screen
            header={
                <ScreenHeader content={translate('moduleSettings.coinEnabling.settings.title')} />
            }
        >
            {showNetworks ? <DiscoveryCoinsFilter /> : <BtcOnlyCoinEnablingContent />}
        </Screen>
    );
};
