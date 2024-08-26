import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import { Translation, useTranslate } from '@suite-native/intl';
import { BtcOnlyCoinEnablingContent, DiscoveryCoinsFilter } from '@suite-native/coin-enabling';
import { Box, Text } from '@suite-native/atoms';
import { selectIsBitcoinOnlyDevice } from '@suite-common/wallet-core';
import {
    selectDiscoverySupportedNetworks,
    selectEnabledDiscoveryNetworkSymbols,
    setIsCoinEnablingInitFinished,
} from '@suite-native/discovery';

export const SettingsCoinEnablingScreen = () => {
    const dispatch = useDispatch();

    const { translate } = useTranslate();
    const enabledNetworkSymbols = useSelector(selectEnabledDiscoveryNetworkSymbols);
    const availableNetworks = useSelector(selectDiscoverySupportedNetworks);
    const isBitcoinOnlyDevice = useSelector(selectIsBitcoinOnlyDevice);

    const showBtcOnly = availableNetworks.length === 1 && isBitcoinOnlyDevice;

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
            {showBtcOnly ? ( //testnets can be enabled and we want to show the switcher in that case
                <BtcOnlyCoinEnablingContent />
            ) : (
                <Box paddingHorizontal="small">
                    <Box alignItems="center" paddingBottom="extraLarge">
                        <Text textAlign="center" color="textSubdued">
                            <Translation id="moduleSettings.coinEnabling.settings.subtitle" />
                        </Text>
                    </Box>
                    <DiscoveryCoinsFilter />
                </Box>
            )}
        </Screen>
    );
};
