import styled, { useTheme } from 'styled-components';
import { CSSProperties, MouseEventHandler, forwardRef } from 'react';
import { DeviceModelInternal } from '@trezor/connect';
import { AnimationWrapper, Shape } from './AnimationPrimitives';
import { resolveStaticPath } from '../../utils/resolveStaticPath';

const StyledVideo = styled.video`
    width: 100%;
    height: 100%;
`;

export type AnimationDeviceType =
    | 'BOOTLOADER'
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
            // if no Trezor available, show flagship model
            deviceModelInternal = DeviceModelInternal.T2T1,
            deviceUnitColor,
            onVideoMouseOver,
            ...props
        },
        videoRef,
    ) => {
        const { THEME } = useTheme();

        // T2B1 animations are transparent
        const theme = deviceModelInternal === DeviceModelInternal.T2B1 ? '' : `_${THEME}`;

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
                                `videos/device/trezor_${deviceModelInternal.toLowerCase()}_${type.toLowerCase()}${theme}.webm`,
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
                                `videos/device/trezor_${DeviceModelInternal.T1B1.toLowerCase()}_${type.toLowerCase()}${theme}.webm`,
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
                                `videos/device/trezor_${deviceModelInternal.toLowerCase()}_hologram.webm`,
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
                                `videos/device/trezor_${DeviceModelInternal.T2B1.toLowerCase()}_rotate_color_${
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
