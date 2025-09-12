import { CSSProperties, MouseEventHandler, forwardRef } from 'react';

import { useTheme } from 'styled-components';

// TODO: suite-common imports in non-suite packages should not be allowed
import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { AnimationWrapper, Shape } from '@trezor/components';
import { DeviceModelInternal, getNarrowedDeviceModelInternal } from '@trezor/device-utils';

import { ConnectBtAnimation } from './ConnectBtAnimation';
import { Video } from './Video';
import { getModelFrontColor } from '../../utils/getModelFrontColor';

export const animationDeviceTypes = [
    'BOOTLOADER', // No longer available for T3T1
    'BOOTLOADER_TWO_BUTTONS', // Only available for T1B1 with old FW
    'NORMAL', // Only available for T1B1
    'SUCCESS',
    'HOLOGRAM',
    'ROTATE',
    'CONNECT_BT',
    'CONNECT_CABLE',
] as const;
export type AnimationDeviceType = (typeof animationDeviceTypes)[number];

type DeviceAnimationProps = {
    height?: CSSProperties['height'];
    width?: CSSProperties['width'];
    type: AnimationDeviceType;
    loop?: boolean;
    shape?: Shape;
    deviceModelInternal?: DeviceModelInternal;
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

        const deviceModelInFilename =
            getNarrowedDeviceModelInternal(deviceModelInternal).toLowerCase();

        // Key is used to force re-render of the video element. When `src` of the inner <source> tag
        // changes, the video element does not re-render. This is a workaround.
        const rerenderKey = `${deviceModelInFilename}_${type.toLowerCase()}_${deviceUnitColor}_${themeSuffix}`;

        const commonProps = {
            loop,
            videoRef,
            onMouseOver,
            rerenderKey,
        };

        if (deviceModelInternal === DeviceModelInternal.UNKNOWN) return null;

        return (
            <AnimationWrapper height={height} width={width} shape={shape} {...props}>
                {['BOOTLOADER'].includes(type) && (
                    <Video
                        src={`videos/device/trezor_${deviceModelInFilename}_${type.toLowerCase()}${themeSuffix}.webm`}
                        {...commonProps}
                    />
                )}
                {['SUCCESS'].includes(type) && (
                    <Video
                        src={`videos/device/trezor_${deviceModelInFilename}_${type.toLowerCase()}_frontcolor_${getModelFrontColor(deviceModelInternal, deviceUnitColor)}.webm`}
                        {...commonProps}
                    />
                )}
                {/* Images available only for T1B1 */}
                {['BOOTLOADER_TWO_BUTTONS', 'NORMAL'].includes(type) && (
                    <Video
                        src={`videos/device/trezor_${DeviceModelInternal.T1B1.toLowerCase()}_${type.toLowerCase()}${themeSuffix}.webm`}
                        {...commonProps}
                    />
                )}
                {type === 'HOLOGRAM' && (
                    <Video
                        src={`videos/device/trezor_${deviceModelInFilename}_hologram.webm`}
                        {...commonProps}
                    />
                )}
                {type === 'ROTATE' && (
                    <Video
                        src={`videos/device/trezor_${deviceModelInFilename}_rotate_color_${
                            // if device unit color is not set, use first color available
                            deviceUnitColor ?? 1
                        }${sizeVariant ? `_${sizeVariant.toLowerCase()}` : ''}.webm`}
                        {...commonProps}
                    />
                )}
                {type === 'CONNECT_CABLE' && (
                    <Video src="videos/device/trezor_t3w1_connect_cable.webm" {...commonProps} />
                )}
                {type === 'CONNECT_BT' && (
                    <ConnectBtAnimation
                        rerenderKey={rerenderKey}
                        videoRef={videoRef}
                        onMouseOver={onMouseOver}
                    />
                )}
            </AnimationWrapper>
        );
    },
);
