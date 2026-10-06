import { useWindowDimensions } from 'react-native';

import { Image } from '@suite-native/atoms';
import { type SetupSupportingDeviceModel } from '@suite-native/device';
import { DeviceModelInternal } from '@trezor/device-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type DeviceImageSize = 'normal' | 'small';

type DeviceModelImageProps = {
    deviceModel: SetupSupportingDeviceModel;
    size: DeviceImageSize;
};

const deviceModelImageMap = {
    [DeviceModelInternal.T2T1]: require('../assets/t2t1.webp'),
    [DeviceModelInternal.T2B1]: require('../assets/t3b1.webp'),
    [DeviceModelInternal.T3B1]: require('../assets/t3b1.webp'),
    [DeviceModelInternal.T3T1]: require('../assets/t3t1.webp'),
    [DeviceModelInternal.T3W1]: require('../assets/t3w1.webp'),
} as const satisfies Record<SetupSupportingDeviceModel, string>;

const sizeToHeightMap = {
    normal: 360,
    small: 280,
} as const satisfies Record<DeviceImageSize, number>;

const MAX_HEIGHT_RATIO = 2 / 3;

const deviceImageStyle = prepareNativeStyle<{ size: DeviceImageSize; windowHeight: number }>(
    (_, { size, windowHeight }) => ({
        width: '100%',
        height: sizeToHeightMap[size],
        maxHeight: windowHeight * MAX_HEIGHT_RATIO,
        alignItems: 'center',
    }),
);

export const DeviceModelImage = ({ deviceModel, size }: DeviceModelImageProps) => {
    const { applyStyle } = useNativeStyles();
    const { height: windowHeight } = useWindowDimensions();

    return (
        <Image
            source={deviceModelImageMap[deviceModel]}
            contentFit="contain"
            style={applyStyle(deviceImageStyle, { size, windowHeight })}
        />
    );
};
