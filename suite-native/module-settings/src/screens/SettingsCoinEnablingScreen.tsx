import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { View } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import { useTranslate } from '@suite-native/intl';
import { BtcOnlyCoinEnablingContent, DiscoveryCoinsFilter } from '@suite-native/coin-enabling';
import { Box } from '@suite-native/atoms';
import { selectIsBitcoinOnlyDevice } from '@suite-common/wallet-core';
import {
    selectDiscoverySupportedNetworks,
    selectEnabledDiscoveryNetworkSymbols,
    setIsCoinEnablingInitFinished,
} from '@suite-native/discovery';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { hexToRgba } from '@suite-common/suite-utils';

const GRADIENT_HEIGHT = 40;

const gradientBaseStyleParams = prepareNativeStyle<{ bottom: number }>((_, { bottom }) => ({
    width: '100%',
    height: GRADIENT_HEIGHT,
    position: 'absolute',
    bottom,
    pointerEvents: 'none',
}));

const headerWrapperStyle = prepareNativeStyle(_ => ({
    zIndex: 2,
}));

export const SettingsCoinEnablingScreen = () => {
    const dispatch = useDispatch();
    const { applyStyle, utils } = useNativeStyles();
    const { translate } = useTranslate();

    const enabledNetworkSymbols = useSelector(selectEnabledDiscoveryNetworkSymbols);
    const availableNetworks = useSelector(selectDiscoverySupportedNetworks);
    const isBitcoinOnlyDevice = useSelector(selectIsBitcoinOnlyDevice);

    //testnets can be enabled and we want to show networks that case
    const showNetworks = availableNetworks.length > 1 || !isBitcoinOnlyDevice;

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
    const transparentColor = hexToRgba(utils.colors.backgroundSurfaceElevation0, 0.001);

    return (
        <Screen
            screenHeader={
                <View style={applyStyle(headerWrapperStyle)}>
                    <ScreenSubHeader
                        content={translate('moduleSettings.coinEnabling.settings.title')}
                    />
                    {showNetworks && (
                        <LinearGradient
                            dither={false}
                            colors={[utils.colors.backgroundSurfaceElevation0, transparentColor]}
                            style={applyStyle(gradientBaseStyleParams, {
                                bottom: -GRADIENT_HEIGHT,
                            })}
                        />
                    )}
                </View>
            }
            footer={
                showNetworks && (
                    <LinearGradient
                        dither={false}
                        colors={[transparentColor, utils.colors.backgroundSurfaceElevation0]}
                        style={applyStyle(gradientBaseStyleParams, { bottom: 0 })}
                    />
                )
            }
        >
            {showNetworks ? (
                <Box paddingTop="large" paddingBottom="medium" paddingHorizontal="small">
                    <DiscoveryCoinsFilter />
                </Box>
            ) : (
                <BtcOnlyCoinEnablingContent />
            )}
        </Screen>
    );
};
