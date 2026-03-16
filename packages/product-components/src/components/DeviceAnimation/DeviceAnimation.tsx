import { type MouseEventHandler, forwardRef } from 'react';

import { useTheme } from 'styled-components';

import {
    type AllowedAnimationPrimitiveFrameProps,
    AnimationWrapper,
    type Shape,
    allowedAnimationPrimitivesFrameProps,
    pickAndPrepareFrameProps,
} from '@trezor/components';
import { DeviceModelInternal, getNarrowedDeviceModelInternal } from '@trezor/device-utils';

import { Video } from './Video';
import {
    type AnimationType,
    type ColorsFor,
    DEVICE_ANIMATION_CONFIG,
    type ModelFor,
} from './deviceAnimationConfig';

const getThemeVariant = (theme: any) =>
    (theme?.legacy?.THEME as string | undefined)?.toLowerCase() === 'dark' ? 'dark' : 'light';

type Base = AllowedAnimationPrimitiveFrameProps & {
    loop?: boolean;
    shape?: Shape;
    onEnded?: () => void;
    autoPlay?: boolean;
    className?: string;
    onVideoMouseOver?: MouseEventHandler<HTMLVideoElement>;
};

type GenericDeviceAnimationProps<T extends AnimationType> = {
    [M in ModelFor<T>]: Base & {
        type: T;
        deviceModelInternal: M;
    } & (ColorsFor<T, M> extends never ? {} : { deviceUnitColor?: ColorsFor<T, M> }) &
        ((typeof DEVICE_ANIMATION_CONFIG)[T] extends { hasSize: true }
            ? { sizeVariant?: 'LARGE' }
            : {});
}[ModelFor<T>];

export type DeviceAnimationProps = {
    [T in AnimationType]: GenericDeviceAnimationProps<T>;
}[AnimationType];

export const DeviceAnimation = forwardRef<HTMLVideoElement, DeviceAnimationProps>(
    (props, videoRef) => {
        const {
            type,
            loop = false,
            shape,
            onVideoMouseOver: onMouseOver,
            autoPlay = true,
            onEnded,
            ...rest
        } = props;

        const theme = useTheme();
        const frameProps = pickAndPrepareFrameProps(rest, allowedAnimationPrimitivesFrameProps);

        const model = getNarrowedDeviceModelInternal(props.deviceModelInternal);
        const variant = getThemeVariant(theme);
        const modelDir = model.toLowerCase();

        const withThemeVariant = (base: string) => `${base}_${variant}.webm`;
        const basePath = `videos/device/${modelDir}`;
        const rerenderKey = `${modelDir}_${type.toLowerCase()}_${variant}`;
        const commonVideoProps = { loop, videoRef, onMouseOver, rerenderKey, onEnded, autoPlay };

        const content = (() => {
            switch (type) {
                case 'BOOTLOADER': {
                    const file =
                        model === DeviceModelInternal.T3B1
                            ? 'bootloader.webm'
                            : withThemeVariant('bootloader');

                    return <Video src={`${basePath}/${file}`} {...commonVideoProps} />;
                }

                case 'BOOTLOADER_TWO_BUTTONS':
                    return (
                        <Video
                            src={`${basePath}/${withThemeVariant('bootloader_two_buttons')}`}
                            {...commonVideoProps}
                        />
                    );

                case 'RECONNECT':
                    return (
                        <Video
                            src={`${basePath}/${withThemeVariant('reconnect')}`}
                            {...commonVideoProps}
                        />
                    );

                case 'HOLOGRAM':
                    return <Video src={`${basePath}/hologram.webm`} {...commonVideoProps} />;

                case 'ROTATE': {
                    const { deviceModelInternal, deviceUnitColor, sizeVariant } = props as Extract<
                        DeviceAnimationProps,
                        { type: 'ROTATE' }
                    >;

                    const modelConfig =
                        DEVICE_ANIMATION_CONFIG.ROTATE.models[
                            deviceModelInternal as keyof typeof DEVICE_ANIMATION_CONFIG.ROTATE.models
                        ];

                    const allowedColors = modelConfig.colors ?? [1];
                    const color = deviceUnitColor ?? allowedColors[0];
                    const size = sizeVariant ? '_large' : '';

                    return (
                        <Video
                            src={`${basePath}/rotate_color_${color}${size}.webm`}
                            {...commonVideoProps}
                        />
                    );
                }

                case 'PAIRING_MODE':
                    return (
                        <Video
                            src={`${basePath}/pairing_mode_${theme.mode}.webm`}
                            {...commonVideoProps}
                        />
                    );
                case 'CONNECT_CABLE':
                    return <Video src={`${basePath}/connect_cable.webm`} {...commonVideoProps} />;
                case 'CONNECT_BT_INTRO':
                    return <Video src={`${basePath}/connect_bt.webm`} {...commonVideoProps} />;
                case 'CONNECT_BT_LOOP':
                    return <Video src={`${basePath}/connect_bt_loop.webm`} {...commonVideoProps} />;
            }
        })();

        return (
            <AnimationWrapper shape={shape} {...frameProps}>
                {content}
            </AnimationWrapper>
        );
    },
);
