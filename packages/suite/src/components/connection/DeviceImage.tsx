import styled from 'styled-components';

import { resolveStaticPath } from '@suite-common/suite-utils';
import { Image, PNG_IMAGES, PNG_PATH } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';

export const DEFAULT_CONNECT_DEVICE_NAME = 'T3T1-CONNECT-ON' as const;
// component taken from native part of app, edit for desktop & web usage only for one model
type SupportedDeviceModels = DeviceModelInternal.T3W1;

const deviceImageMap: Record<SupportedDeviceModels | typeof DEFAULT_CONNECT_DEVICE_NAME, string> = {
    [DeviceModelInternal.T3W1]: resolveStaticPath(`${PNG_PATH}/${PNG_IMAGES.TREZOR_T3W1_LARGE_2x}`),
    [DEFAULT_CONNECT_DEVICE_NAME]: resolveStaticPath(`${PNG_PATH}/${PNG_IMAGES.TREZOR_T3W1_LARGE}`),
};

type DeviceImageSize = 'small' | 'normal' | 'large';
type DeviceImageDimensions = {
    width: number;
    height: number;
};

export const deviceImageSizeToDimensionsMap = {
    small: {
        width: 68,
        height: 112,
    },
    normal: {
        width: 92,
        height: 151,
    },
    large: {
        width: 243,
        height: 400,
    },
} as const satisfies Record<DeviceImageSize, DeviceImageDimensions>;

const ImageWrapper = styled.div<{
    $size: DeviceImageSize;
    $maxHeight?: number;
}>`
    width: ${({ $size }) => deviceImageSizeToDimensionsMap[$size].width}px;
    height: ${({ $size }) => deviceImageSizeToDimensionsMap[$size].height}px;
    max-height: ${({ $maxHeight }) => ($maxHeight ? `${$maxHeight}px` : 'none')};

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
`;

export type DeviceImageProps = {
    deviceModel: SupportedDeviceModels | typeof DEFAULT_CONNECT_DEVICE_NAME;
    size?: DeviceImageSize;
    maxHeight?: number;
};

export const DeviceImage = ({ deviceModel, size = 'normal', maxHeight }: DeviceImageProps) => (
    <ImageWrapper $size={size} $maxHeight={maxHeight}>
        <Image imageSrc={deviceImageMap[deviceModel]} />
    </ImageWrapper>
);
