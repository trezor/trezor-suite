import { useDispatch, useSelector } from 'react-redux';
import { Pressable } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { HStack } from '@suite-native/atoms';
import {
    DeviceRootState,
    selectDeviceById,
    selectDeviceId,
    selectDeviceThunk,
} from '@suite-common/wallet-core';
import { Icon } from '@suite-common/icons';
import { TrezorDevice } from '@suite-common/suite-types';

import { useDeviceManager } from '../hooks/useDeviceManager';
import { DeviceItemContent } from './DeviceItemContent';

type DeviceItemProps = {
    id: TrezorDevice['id'];
};

const deviceItemWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: utils.borders.radii.medium,
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation1,
    paddingHorizontal: utils.spacings.medium,
    paddingVertical: 12,
}));

export const DeviceItem = ({ id: deviceItemId }: DeviceItemProps) => {
    const dispatch = useDispatch();
    const { applyStyle } = useNativeStyles();

    const selectedDeviceId = useSelector(selectDeviceId);
    const device = useSelector((state: DeviceRootState) => selectDeviceById(state, deviceItemId));

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const handleSelectDevice = () => {
        setIsDeviceManagerVisible(false);

        if (deviceItemId === selectedDeviceId) return;

        dispatch(selectDeviceThunk(device));
    };

    return (
        <Pressable onPress={handleSelectDevice}>
            <HStack style={applyStyle(deviceItemWrapperStyle)}>
                <DeviceItemContent deviceId={deviceItemId} />
                <Icon name="chevronRight" color="iconDefault" />
            </HStack>
        </Pressable>
    );
};
