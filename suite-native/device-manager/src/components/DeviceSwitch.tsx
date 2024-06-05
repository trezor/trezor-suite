import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { Box, HStack } from '@suite-native/atoms';
import { Icon } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectDeviceInstances, selectDeviceState } from '@suite-common/wallet-core';

import { SCREEN_HEADER_HEIGHT } from '../constants';
import { useDeviceManager } from '../hooks/useDeviceManager';
import { DeviceItemContent } from './DeviceItem/DeviceItemContent';

type SwitchStyleProps = { isDeviceManagerVisible: boolean };

const switchStyle = prepareNativeStyle<SwitchStyleProps>((utils, { isDeviceManagerVisible }) => ({
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: SCREEN_HEADER_HEIGHT,
    paddingVertical: utils.spacings.small,
    paddingHorizontal: utils.spacings.medium,
    borderColor: utils.colors.borderElevation2,
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

    const deviceState = useSelector(selectDeviceState);
    const wallets = useSelector(selectDeviceInstances);

    const { setIsDeviceManagerVisible, isDeviceManagerVisible } = useDeviceManager();

    const toggleDeviceManager = () => {
        setIsDeviceManagerVisible(!isDeviceManagerVisible);
    };

    return (
        <Pressable onPress={toggleDeviceManager} style={applyStyle(switchWrapperStyle)}>
            <HStack justifyContent="space-between" alignItems="center" spacing="medium">
                <Box style={applyStyle(switchStyle, { isDeviceManagerVisible })}>
                    {deviceState && (
                        <DeviceItemContent
                            deviceState={deviceState}
                            headerTextVariant="highlight"
                            variant={wallets.length > 1 ? 'walletDetail' : 'simple'}
                            isSubHeaderForceHidden={true}
                        />
                    )}
                    <Icon name="chevronUpAndDown" color="iconDefault" />
                </Box>
            </HStack>
        </Pressable>
    );
};
