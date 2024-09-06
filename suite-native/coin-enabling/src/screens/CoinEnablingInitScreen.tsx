import { useDispatch, useSelector } from 'react-redux';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useEffect } from 'react';
import { BackHandler, View } from 'react-native';

import { A } from '@mobily/ts-belt';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen } from '@suite-native/navigation';
import { Box, Button, Text, VStack } from '@suite-native/atoms';
import {
    applyDiscoveryChangesThunk,
    selectEnabledDiscoveryNetworkSymbols,
    setIsCoinEnablingInitFinished,
} from '@suite-native/discovery';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { analytics, EventType } from '@suite-native/analytics';
import { hexToRgba } from '@suite-common/suite-utils';

import { DiscoveryCoinsFilter } from '../components/DiscoveryCoinsFilter';

const BOTTOM_OFFSET = 12;
const BUTTON_HEIGHT = 48;

const headerWrapperStyle = prepareNativeStyle(utils => ({
    zIndex: 2,
    paddingTop: utils.spacings.extraLarge,
}));

const gradientBackgroundTopStyle = prepareNativeStyle(utils => ({
    width: '100%',
    height: utils.spacings.medium,
    position: 'absolute',
    bottom: -utils.spacings.medium,
    pointerEvents: 'none',
}));

const contentStyle = prepareNativeStyle(_ => ({
    paddingBottom: BOTTOM_OFFSET,
}));

const gradientBackgroundBottomStyle = prepareNativeStyle<{ showButton: boolean }>(
    (_, { showButton }) => ({
        width: '100%',
        height: 40,
        position: 'absolute',
        bottom: -BOTTOM_OFFSET,
        pointerEvents: 'none',
        extend: [{ condition: showButton, style: { bottom: BUTTON_HEIGHT } }],
    }),
);

const buttonWrapperStyle = prepareNativeStyle(utils => ({
    bottom: BOTTOM_OFFSET,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    width: '100%',
}));

const buttonStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.medium,
}));

export const CoinEnablingInitScreen = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const { applyStyle, utils } = useNativeStyles();
    const enabledNetworkSymbols = useSelector(selectEnabledDiscoveryNetworkSymbols);

    const handleSave = () => {
        dispatch(setIsCoinEnablingInitFinished(true));
        if (enabledNetworkSymbols.length > 0) {
            dispatch(setIsCoinEnablingInitFinished(true));
            dispatch(applyDiscoveryChangesThunk());
            analytics.report({
                type: EventType.CoinEnablingInitState,
                payload: { enabledNetworks: enabledNetworkSymbols },
            });
            navigation.goBack();
        }
    };

    useEffect(() => {
        //prevent dismissing screen via HW
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            return true;
        });

        return () => subscription.remove();
    }, []);

    // 'transparent' color is not working in context of LinearGradient on iOS. RGBA has to be used instead.
    const transparentColor = hexToRgba(utils.colors.backgroundSurfaceElevation0, 0.01);

    const canBeSaved = A.isNotEmpty(enabledNetworkSymbols);

    return (
        <Screen
            customHorizontalPadding={utils.spacings.medium}
            screenHeader={
                <View style={applyStyle(headerWrapperStyle)}>
                    <VStack paddingBottom="extraLarge" paddingHorizontal="medium">
                        <Text variant="titleSmall">
                            <Translation id="moduleSettings.coinEnabling.initialSetup.title" />
                        </Text>
                        <Text color="textSubdued">
                            <Translation id="moduleSettings.coinEnabling.initialSetup.subtitle" />
                        </Text>
                    </VStack>
                    <LinearGradient
                        dither={false}
                        colors={[utils.colors.backgroundSurfaceElevation0, transparentColor]}
                        style={applyStyle(gradientBackgroundTopStyle)}
                    />
                </View>
            }
            footer={
                <View style={applyStyle(buttonWrapperStyle)}>
                    <LinearGradient
                        dither={false}
                        colors={[transparentColor, utils.colors.backgroundSurfaceElevation0]}
                        style={applyStyle(gradientBackgroundBottomStyle, {
                            showButton: canBeSaved,
                        })}
                    />

                    {canBeSaved && (
                        <Animated.View
                            entering={SlideInDown}
                            exiting={SlideOutDown}
                            style={applyStyle(buttonStyle)}
                        >
                            <Button onPress={handleSave} testID="@coin-enabling/button-save">
                                <Translation id="moduleSettings.coinEnabling.initialSetup.button" />
                            </Button>
                        </Animated.View>
                    )}
                </View>
            }
        >
            <Box style={applyStyle(contentStyle)}>
                <DiscoveryCoinsFilter allowDeselectLastCoin={true} allowChangeAnalytics={false} />
            </Box>
        </Screen>
    );
};
