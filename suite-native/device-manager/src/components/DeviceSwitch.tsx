import { useEffect } from 'react';
import { Pressable } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { Box, HStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { SCREEN_HEADER_HEIGHT } from '../constants';
import { DeviceSwitchContent } from './DeviceSwitchContent';
import { useDeviceManager } from '../hooks/useDeviceManager';

type SwitchStyleProps = { isDeviceManagerVisible: boolean };

const switchStyle = prepareNativeStyle<SwitchStyleProps>((utils, { isDeviceManagerVisible }) => ({
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: SCREEN_HEADER_HEIGHT,
    paddingVertical: utils.spacings.sp8,
    paddingHorizontal: utils.spacings.sp16,
    borderColor: utils.colors.legacyBorderElevation2,
    borderWidth: utils.borders.widths.small,
    borderRadius: utils.borders.radii.r16,
    backgroundColor: utils.colors.surfaceFillRaised,
    extends: {
        condition: isDeviceManagerVisible,
        style: {
            borderWidth: utils.borders.widths.large,
        },
    },
}));

const switchWrapperStyle = prepareNativeStyle(_ => ({
    flex: 1,
    zIndex: 10,
}));

export const DeviceSwitch = () => {
    const navigation = useNavigation();
    const { applyStyle } = useNativeStyles();

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
                <Box style={applyStyle(switchStyle, { isDeviceManagerVisible })}>
                    <DeviceSwitchContent />
                    <Icon name="caretUpDown" color="contentPrimary" />
                </Box>
            </HStack>
        </Pressable>
    );
};
