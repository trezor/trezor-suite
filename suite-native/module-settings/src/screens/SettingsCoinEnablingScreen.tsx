import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectEnabledNetworks, selectHasBitcoinOnlyFirmware } from '@suite-common/wallet-core';
import { BtcOnlyCoinEnablingContent, CoinEnablingForm } from '@suite-native/coin-enabling';
import { selectDiscoveryNetworkSymbols } from '@suite-native/discovery';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';
import { setIsCoinEnablingInitFinished } from '@suite-native/settings';

export const SettingsCoinEnablingScreen = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const enabledNetworkSymbols = useSelector(selectEnabledNetworks);
    const availableNetworkSymbols = useSelector(selectDiscoveryNetworkSymbols);
    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);

    //testnets can be enabled and we want to show networks that case
    const showNetworks = availableNetworkSymbols.length > 1 || !hasBitcoinOnlyFirmware;

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
                <DynamicScreenHeader
                    title={<Translation id="moduleSettings.coinEnabling.settings.title" />}
                    subtitle={<Translation id="moduleSettings.coinEnabling.settings.subtitle" />}
                />
            }
        >
            {showNetworks ? <CoinEnablingForm /> : <BtcOnlyCoinEnablingContent />}
        </Screen>
    );
};
