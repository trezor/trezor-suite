import { Pressable } from 'react-native';

import { type TrezorDevice } from '@suite-common/suite-types';
import { HStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { DeviceItemContent } from './DeviceItemContent';

type DeviceItemProps = {
    device: TrezorDevice;
    onPress: () => void;
};

const deviceItemWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: utils.spacings.sp16,
}));

export const DeviceItem = ({ device, onPress }: DeviceItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable onPress={onPress}>
            <HStack style={applyStyle(deviceItemWrapperStyle)}>
                <DeviceItemContent device={device} />
                <Icon name="caretRight" color="contentPrimary" size="mediumLarge" />
            </HStack>
        </Pressable>
    );
};
