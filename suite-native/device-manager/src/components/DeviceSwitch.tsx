import { Pressable, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { Box, HStack } from '@suite-native/atoms';
import { Icon } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    selectDeviceId,
    selectAreAllDevicesDisconnectedOrAccountless,
} from '@suite-common/wallet-core';

import { SCREEN_HEADER_HEIGHT } from '../constants';
import { useDeviceManager } from '../hooks/useDeviceManager';
import { DeviceItemContent } from './DeviceItemContent';

type SwitchStyleProps = { isDeviceManagerVisible: boolean };

const switchStyle = prepareNativeStyle<SwitchStyleProps>((utils, { isDeviceManagerVisible }) => ({
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: SCREEN_HEADER_HEIGHT,
    paddingVertical: utils.spacings.small,
    paddingHorizontal: utils.spacings.medium,
    borderColor: utils.colors.borderOnElevation1,
    borderWidth: utils.borders.widths.small,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,

    extends: {
        condition: isDeviceManagerVisible,
        style: {
            borderWidth: utils.borders.widths.large,
        },
    },
}));

const switchWrapperStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

export const DeviceSwitch = () => {
    const { applyStyle } = useNativeStyles();

    const areAllDevicesDisconnectedOrAccountless = useSelector(
        selectAreAllDevicesDisconnectedOrAccountless,
    );
    const deviceId = useSelector(selectDeviceId);

    const { setIsDeviceManagerVisible, isDeviceManagerVisible } = useDeviceManager();

    const toggleDeviceManager = () => {
        setIsDeviceManagerVisible(!isDeviceManagerVisible);
    };

    return (
        <Pressable onPress={toggleDeviceManager} style={applyStyle(switchWrapperStyle)}>
            <HStack justifyContent="space-between" alignItems="center" spacing="medium">
                <Box style={applyStyle(switchStyle, { isDeviceManagerVisible })}>
                    <DeviceItemContent
                        deviceId={areAllDevicesDisconnectedOrAccountless ? undefined : deviceId}
                        headerTextVariant="highlight"
                        isPortfolioLabelDisplayed={false}
                    />
                    {!isDeviceManagerVisible && (
                        <Icon name="chevronUpAndDown" color="iconDefault" />
                    )}
                </Box>
                {isDeviceManagerVisible && (
                    <TouchableOpacity
                        onPress={toggleDeviceManager}
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                    >
                        <Box paddingHorizontal="medium">
                            <Icon name="close" size="mediumLarge" />
                        </Box>
                    </TouchableOpacity>
                )}
            </HStack>
        </Pressable>
    );
};
