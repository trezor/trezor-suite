import { CSSProperties, MouseEventHandler, forwardRef } from 'react';
import styled, { useTheme } from 'styled-components';

import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { getNarrowedDeviceModelInternal } from '@suite-common/suite-utils';
import { DeviceModelInternal } from '@trezor/connect';

import { AnimationWrapper, Shape } from './AnimationPrimitives';
import { resolveStaticPath } from '../../utils/resolveStaticPath';

const StyledVideo = styled.video`
    width: 100%;
    height: 100%;
`;

export type AnimationDeviceType =
    | 'BOOTLOADER' // No longer available for T3T1
    | 'BOOTLOADER_TWO_BUTTONS' // Only available for T1B1 with old FW
    | 'NORMAL' // Only available for T1B1
    | 'SUCCESS'
    | 'HOLOGRAM'
    | 'ROTATE';

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
            onVideoMouseOver,
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

        return (
            <AnimationWrapper height={height} width={width} shape={shape} {...props}>
                {['BOOTLOADER', 'SUCCESS'].includes(type) && (
                    <StyledVideo
                        loop={loop}
                        autoPlay
                        muted
                        width={width}
                        height={height}
                        ref={videoRef}
                        onMouseOver={onVideoMouseOver}
                    >
                        <source
                            src={resolveStaticPath(
                                `videos/device/trezor_${deviceModelInFilename}_${type.toLowerCase()}${themeSuffix}.webm`,
                            )}
                            type="video/webm"
                        />
                    </StyledVideo>
                )}
                {/* Images available only for T1B1 */}
                {['BOOTLOADER_TWO_BUTTONS', 'NORMAL'].includes(type) && (
                    <StyledVideo
                        loop={loop}
                        autoPlay
                        muted
                        height={height}
                        width={width}
                        ref={videoRef}
                        onMouseOver={onVideoMouseOver}
                    >
                        <source
                            src={resolveStaticPath(
                                `videos/device/trezor_${DeviceModelInternal.T1B1.toLowerCase()}_${type.toLowerCase()}${themeSuffix}.webm`,
                            )}
                            type="video/webm"
                        />
                    </StyledVideo>
                )}
                {type === 'HOLOGRAM' && (
                    <StyledVideo
                        loop={loop}
                        autoPlay
                        muted
                        ref={videoRef}
                        onMouseOver={onVideoMouseOver}
                    >
                        <source
                            src={resolveStaticPath(
                                `videos/device/trezor_${deviceModelInFilename}_hologram.webm`,
                            )}
                            type="video/webm"
                        />
                    </StyledVideo>
                )}
                {type === 'ROTATE' && (
                    <StyledVideo
                        loop={loop}
                        autoPlay
                        muted
                        width={height}
                        height={height}
                        ref={videoRef}
                        onMouseOver={onVideoMouseOver}
                    >
                        <source
                            src={resolveStaticPath(
                                `videos/device/trezor_${deviceModelInFilename}_rotate_color_${
                                    // if device unit color is not set, use first color available
                                    deviceUnitColor ?? 1
                                }.webm`,
                            )}
                            type="video/webm"
                        />
                    </StyledVideo>
                )}
            </AnimationWrapper>
        );
    },
);
