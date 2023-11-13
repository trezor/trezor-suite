import { useDispatch, useSelector } from 'react-redux';
import { Pressable } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { HStack, Text, VStack } from '@suite-native/atoms';
import {
    DeviceRootState,
    selectDevice,
    selectDeviceById,
    selectDeviceLabel,
    selectDeviceName,
    selectDeviceThunk,
} from '@suite-common/wallet-core';
import { Icon } from '@suite-common/icons';
import { TrezorDevice } from '@suite-common/suite-types';

import { useDeviceManager } from '../hooks/useDeviceManager';

type DeviceItemProps = {
    id: TrezorDevice['id'];
};

const deviceItemWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: utils.borders.radii.medium,
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation0,
    paddingHorizontal: utils.spacings.medium,
    paddingVertical: 12,
}));

export const DeviceItem = ({ id }: DeviceItemProps) => {
    const dispatch = useDispatch();

    const deviceLabel = useSelector((state: DeviceRootState) => selectDeviceLabel(state, id));
    const deviceName = useSelector((state: DeviceRootState) => selectDeviceName(state, id));
    const device = useSelector((state: DeviceRootState) => selectDeviceById(state, id));
    const currentDevice = useSelector(selectDevice);

    const { applyStyle } = useNativeStyles();

    const { setIsDeviceManagerVisible } = useDeviceManager();

    if (!deviceLabel) return null;

    const handleSelectDevice = () => {
        setIsDeviceManagerVisible(false);

        if (device?.id === currentDevice?.id) return;

        dispatch(selectDeviceThunk(device));
    };

    return (
        <Pressable onPress={handleSelectDevice}>
            <HStack style={applyStyle(deviceItemWrapperStyle)}>
                <HStack spacing="medium" alignItems="center">
                    <Icon name="stack" />
                    <VStack spacing="extraSmall">
                        <Text>{deviceName}</Text>
                        <Text>{deviceLabel}</Text>
                    </VStack>
                </HStack>
                <Icon name="chevronRight" />
            </HStack>
        </Pressable>
    );
};
