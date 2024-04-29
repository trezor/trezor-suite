import { Pressable } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { HStack } from '@suite-native/atoms';
import { Icon } from '@suite-common/icons';
import { TrezorDevice } from '@suite-common/suite-types';

import { DeviceItemContent } from './DeviceItemContent';

type DeviceItemProps = {
    deviceState: NonNullable<TrezorDevice['state']>;
    onPress: () => void;
};

const deviceItemWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: utils.spacings.medium,
}));

export const DeviceItem = ({ deviceState, onPress }: DeviceItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable onPress={onPress}>
            <HStack style={applyStyle(deviceItemWrapperStyle)}>
                <DeviceItemContent deviceState={deviceState} />
                <Icon name="chevronRight" color="iconDefault" size="mediumLarge" />
            </HStack>
        </Pressable>
    );
};
