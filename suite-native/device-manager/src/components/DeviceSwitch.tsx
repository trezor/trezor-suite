import { useEffect } from 'react';
import { Pressable } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { Box, GlassBackground, HStack, isLiquidGlassAvailable } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { SCREEN_HEADER_HEIGHT } from '../constants';
import { DeviceSwitchContent } from './DeviceSwitchContent';
import { useDeviceManager } from '../hooks/useDeviceManager';

type SwitchStyleProps = { isDeviceManagerVisible: boolean; hasGlassBackground: boolean };

const switchStyle = prepareNativeStyle<SwitchStyleProps>(
    (utils, { isDeviceManagerVisible, hasGlassBackground }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: SCREEN_HEADER_HEIGHT,
        paddingVertical: utils.spacings.sp8,
        paddingHorizontal: utils.spacings.sp16,
        borderColor: utils.colors.surfaceBorderAction,
        borderWidth: utils.borders.widths.small,
        borderRadius: utils.borders.radii.r16,
        backgroundColor: utils.colors.surfaceFillAction,
        ...utils.boxShadows.small,

        extends: {
            condition: isDeviceManagerVisible,
            style: {
                borderWidth: utils.borders.widths.large,
            },
        },
        extend: {
            // The glass draws its own fill, rim and shadow.
            condition: hasGlassBackground,
            style: {
                backgroundColor: 'transparent',
                borderWidth: 0,
                ...utils.boxShadows.none,
            },
        },
    }),
);

const switchWrapperStyle = prepareNativeStyle(_ => ({
    flex: 1,
    zIndex: 10,
}));

export const DeviceSwitch = () => {
    const navigation = useNavigation();
    const { applyStyle, utils } = useNativeStyles();

    const { setIsDeviceManagerVisible, isDeviceManagerVisible } = useDeviceManager();

    const toggleDeviceManager = () => {
        setIsDeviceManagerVisible(!isDeviceManagerVisible);
    };

    useEffect(
        () => navigation.addListener('blur', () => setIsDeviceManagerVisible(false)),
        [navigation, setIsDeviceManagerVisible],
    );

    return (
        <Pressable
            onPress={toggleDeviceManager}
            style={applyStyle(switchWrapperStyle)}
            testID="@device-manager/device-switch"
        >
            <HStack justifyContent="space-between" alignItems="center" spacing="sp16">
                <Box
                    style={applyStyle(switchStyle, {
                        isDeviceManagerVisible,
                        hasGlassBackground: isLiquidGlassAvailable,
                    })}
                >
                    <GlassBackground
                        shape="roundedRectangle"
                        cornerRadius={utils.borders.radii.r16}
                    />
                    <DeviceSwitchContent />
                    <Icon name="caretUpDown" color="contentPrimary" />
                </Box>
            </HStack>
        </Pressable>
    );
};
