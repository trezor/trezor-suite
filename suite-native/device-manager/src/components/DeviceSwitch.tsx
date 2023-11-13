import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { Box, HStack, IconButton, Text } from '@suite-native/atoms';
import { Icon, IconName } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    selectDeviceModel,
    selectIsDeviceConnectedAndAuthorized,
    selectIsSelectedDeviceImported,
    selectSelectedDeviceName,
} from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import { DeviceModelInternal } from '@trezor/connect';

import { SCREEN_HEADER_HEIGHT } from '../constants';
import { useDeviceManager } from '../hooks/useDeviceManager';

const switchStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: SCREEN_HEADER_HEIGHT,
    paddingVertical: utils.spacings.small,
    paddingHorizontal: utils.spacings.medium,
    borderColor: utils.colors.borderOnElevation1,
    borderWidth: utils.borders.widths.large,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
}));

const switchWrapperStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

const deviceIcon = {
    [DeviceModelInternal.T1B1]: 'trezor',
    [DeviceModelInternal.T2T1]: 'trezorT',
    [DeviceModelInternal.T2B1]: 'trezor',
} as const satisfies Record<DeviceModelInternal, IconName>;

export const DeviceSwitch = () => {
    const deviceName = useSelector(selectSelectedDeviceName);
    const isPortfolioTrackerDevice = useSelector(selectIsSelectedDeviceImported);
    const isDeviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);
    const deviceModel = useSelector(selectDeviceModel);

    const { applyStyle } = useNativeStyles();

    const { setIsDeviceManagerVisible, isDeviceManagerVisible } = useDeviceManager();

    if (!deviceModel) return null;

    const toggleDeviceManager = () => {
        setIsDeviceManagerVisible(!isDeviceManagerVisible);
    };

    return (
        <HStack alignItems="center">
            <Pressable onPress={toggleDeviceManager} style={applyStyle(switchWrapperStyle)}>
                <Box style={applyStyle(switchStyle)}>
                    <HStack alignItems="center" spacing="medium">
                        <Icon
                            name={isPortfolioTrackerDevice ? 'database' : deviceIcon[deviceModel]}
                        />
                        <Box>
                            <Text variant="highlight">{deviceName}</Text>
                            {!isPortfolioTrackerDevice && isDeviceConnectedAndAuthorized && (
                                <Text variant="label" color="textSecondaryHighlight">
                                    <Translation id="deviceManager.status.connected" />
                                </Text>
                            )}
                        </Box>
                    </HStack>
                    <Icon name="chevronUpAndDown" />
                </Box>
            </Pressable>
            {isDeviceManagerVisible && (
                <IconButton
                    colorScheme="tertiaryElevation0"
                    iconName="close"
                    onPress={toggleDeviceManager}
                />
            )}
        </HStack>
    );
};
