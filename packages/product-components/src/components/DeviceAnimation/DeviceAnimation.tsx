import { CSSProperties, MouseEventHandler, forwardRef } from 'react';

import { useTheme } from 'styled-components';

// TODO: suite-common imports in non-suite packages should not be allowed

import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { AnimationWrapper, Shape } from '@trezor/components';
import { DeviceModelInternal, getNarrowedDeviceModelInternal } from '@trezor/device-utils';

import { Video } from './Video';

export const animationDeviceTypes = [
    'BOOTLOADER', // No longer available for T3T1
    'BOOTLOADER_TWO_BUTTONS', // Only available for T1B1 with old FW
    'NORMAL', // Only available for T1B1
    'SUCCESS',
    'HOLOGRAM',
    'ROTATE',
] as const;
export type AnimationDeviceType = (typeof animationDeviceTypes)[number];

type DeviceAnimationProps = {
    height?: CSSProperties['height'];
    width?: CSSProperties['width'];
    type: AnimationDeviceType;
    loop?: boolean;
    shape?: Shape;
    deviceModelInternal?: DeviceModelInternal;
    isOldT2B1Packaging?: boolean;
    deviceUnitColor?: number;
    className?: string;
    sizeVariant?: 'LARGE';

    onVideoMouseOver?: MouseEventHandler<HTMLVideoElement>;
};

export const DeviceAnimation = forwardRef<HTMLVideoElement, DeviceAnimationProps>(
    (
        {
            height,
            width,
            type,
            loop = false,
            shape,
            deviceModelInternal = DEFAULT_FLAGSHIP_MODEL,
            isOldT2B1Packaging,
            deviceUnitColor,
            sizeVariant,
            onVideoMouseOver: onMouseOver,
            ...props
        },
        videoRef,
    ) => {
        const theme = useTheme();

        // Animations on following devices are transparent.
        const themeSuffix = [
            DeviceModelInternal.T2B1,
            DeviceModelInternal.T3B1,
            DeviceModelInternal.T3T1,
            DeviceModelInternal.T3W1,
        ].includes(deviceModelInternal)
            ? ''
            : `_${theme.legacy.THEME}`;

        const deviceModelInFilename = (
            type === 'HOLOGRAM' && isOldT2B1Packaging
                ? DeviceModelInternal.T2B1
                : getNarrowedDeviceModelInternal(deviceModelInternal)
        ).toLowerCase();

        const getFrontColor = () => {
            if (deviceModelInternal === DeviceModelInternal.T3W1) {
                return deviceUnitColor === 2 ? 2 : 1;
            }

            return 1;
        };

        // Key is used to force re-render of the video element. When `src` of the inner <source> tag
        // changes, the video element does not re-render. This is a workaround.
        const rerenderKey = `${deviceModelInFilename}_${type.toLowerCase()}_${deviceUnitColor}_${themeSuffix}`;

        const commonProps = {
            loop,
            videoRef,
            onMouseOver,
        };

        return (
            <AnimationWrapper height={height} width={width} shape={shape} {...props}>
                {['BOOTLOADER'].includes(type) && (
                    <Video
                        src={`videos/device/trezor_${deviceModelInFilename}_${type.toLowerCase()}${themeSuffix}.webm`}
                        rerenderKey={rerenderKey}
                        {...commonProps}
                    />
                )}
                {['SUCCESS'].includes(type) && (
                    <Video
                        src={`videos/device/trezor_${deviceModelInFilename}_${type.toLowerCase()}${themeSuffix}_frontcolor_${getFrontColor()}.webm`}
                        rerenderKey={rerenderKey}
                        {...commonProps}
                    />
                )}
                {/* Images available only for T1B1 */}
                {['BOOTLOADER_TWO_BUTTONS', 'NORMAL'].includes(type) && (
                    <Video
                        src={`videos/device/trezor_${DeviceModelInternal.T1B1.toLowerCase()}_${type.toLowerCase()}${themeSuffix}.webm`}
                        rerenderKey={rerenderKey}
                        {...commonProps}
                    />
                )}
                {type === 'HOLOGRAM' && (
                    <Video
                        src={`videos/device/trezor_${deviceModelInFilename}_hologram.webm`}
                        rerenderKey={rerenderKey}
                        {...commonProps}
                    />
                )}
                {type === 'ROTATE' && (
                    <Video
                        src={`videos/device/trezor_${deviceModelInFilename}_rotate_color_${
                            // if device unit color is not set, use first color available
                            deviceUnitColor ?? 1
                        }${sizeVariant ? `_${sizeVariant.toLowerCase()}` : ''}.webm`}
                        rerenderKey={rerenderKey}
                        {...commonProps}
                    />
                )}
            </AnimationWrapper>
        );
    },
);
