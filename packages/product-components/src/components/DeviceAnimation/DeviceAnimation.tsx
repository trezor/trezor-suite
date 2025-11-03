import { CSSProperties, MouseEventHandler, forwardRef } from 'react';

import { useTheme } from 'styled-components';

import {
    AllowedAnimationPrimitiveFrameProps,
    AnimationWrapper,
    Shape,
    allowedAnimationPrimitivesFrameProps,
    pickAndPrepareFrameProps,
} from '@trezor/components';
import { DeviceModelInternal, getNarrowedDeviceModelInternal } from '@trezor/device-utils';

import { Video } from './Video';

export const DEVICE_ANIMATION_TYPES = {
    ROTATE: 'ROTATE',
    BOOTLOADER: 'BOOTLOADER',
    BOOTLOADER_TWO_BUTTONS: 'BOOTLOADER_TWO_BUTTONS',
    NORMAL: 'NORMAL', // rename to RECONNECT
    HOLOGRAM: 'HOLOGRAM',
    CONNECT_CABLE: 'CONNECT_CABLE',
    CONNECT_BT_INTRO: 'CONNECT_BT_INTRO',
    CONNECT_BT_LOOP: 'CONNECT_BT_LOOP',
} as const;

export type DeviceAnimationType =
    (typeof DEVICE_ANIMATION_TYPES)[keyof typeof DEVICE_ANIMATION_TYPES];

type ModelWithDir =
    | DeviceModelInternal.T1B1
    | DeviceModelInternal.T2T1
    | DeviceModelInternal.T2B1
    | DeviceModelInternal.T3B1
    | DeviceModelInternal.T3T1
    | DeviceModelInternal.T3W1;

type ModelDirName = 't1b1' | 't2t1' | 't2b1' | 't3b1' | 't3t1' | 't3w1';

export const MODEL_DIR = {
    [DeviceModelInternal.T1B1]: 't1b1',
    [DeviceModelInternal.T2T1]: 't2t1',
    [DeviceModelInternal.T2B1]: 't2b1',
    [DeviceModelInternal.T3B1]: 't3b1',
    [DeviceModelInternal.T3T1]: 't3t1',
    [DeviceModelInternal.T3W1]: 't3w1',
} as const satisfies Record<ModelWithDir, ModelDirName>;

const getThemeVariant = (theme: any) =>
    (theme?.legacy?.THEME as string | undefined)?.toLowerCase() === 'dark' ? 'dark' : 'light';

type Base = AllowedAnimationPrimitiveFrameProps & {
    height?: CSSProperties['height'];
    width?: CSSProperties['width'];
    loop?: boolean;
    shape?: Shape;
    onEnded?: () => void;
    className?: string;
    onVideoMouseOver?: MouseEventHandler<HTMLVideoElement>;
};

const MODEL_ROTATE_COLORS = {
    [DeviceModelInternal.T1B1]: [1],
    [DeviceModelInternal.T2T1]: [1],
    [DeviceModelInternal.T2B1]: [1, 2, 3, 4, 5],
    [DeviceModelInternal.T3B1]: [1, 2, 3, 4, 5],
    [DeviceModelInternal.T3T1]: [1, 2, 3, 4, 5],
    [DeviceModelInternal.T3W1]: [1, 2, 3],
} as const;

const MODEL_ROTATE_HAS_LARGE = {
    [DeviceModelInternal.T1B1]: true,
    [DeviceModelInternal.T2T1]: true,
    [DeviceModelInternal.T2B1]: true,
    [DeviceModelInternal.T3B1]: true,
    [DeviceModelInternal.T3T1]: true,
    [DeviceModelInternal.T3W1]: true,
} as const;

export type ModelWithRotate = keyof typeof MODEL_ROTATE_COLORS;
export type ColorsOf<M extends ModelWithRotate> = (typeof MODEL_ROTATE_COLORS)[M][number];
type SizePropFor<M extends ModelWithRotate> = M extends keyof typeof MODEL_ROTATE_HAS_LARGE
    ? { sizeVariant?: 'LARGE' }
    : {};

export type RotateProps = {
    [M in ModelWithRotate]: Base & {
        type: typeof DEVICE_ANIMATION_TYPES.ROTATE;
        deviceModelInternal: M;
        deviceUnitColor?: ColorsOf<M>;
    } & SizePropFor<M>;
}[ModelWithRotate];

type BootloaderProps = Base & {
    type: typeof DEVICE_ANIMATION_TYPES.BOOTLOADER;
    deviceModelInternal:
        | DeviceModelInternal.T1B1
        | DeviceModelInternal.T2T1
        | DeviceModelInternal.T2B1
        | DeviceModelInternal.T3B1;
};

type BootloaderTwoButtonsOrNormalProps = Base & {
    type:
        | typeof DEVICE_ANIMATION_TYPES.BOOTLOADER_TWO_BUTTONS
        | typeof DEVICE_ANIMATION_TYPES.NORMAL;
    deviceModelInternal: DeviceModelInternal.T1B1;
};

type HologramProps = Base & {
    type: typeof DEVICE_ANIMATION_TYPES.HOLOGRAM;
    deviceModelInternal: DeviceModelInternal.T1B1;
};

type ConnectCableProps = Base & {
    type: typeof DEVICE_ANIMATION_TYPES.CONNECT_CABLE;
    deviceModelInternal: DeviceModelInternal.T3W1;
};

type ConnectBtIntroProps = Base & {
    type: typeof DEVICE_ANIMATION_TYPES.CONNECT_BT_INTRO;
    deviceModelInternal: DeviceModelInternal.T3W1;
};
type ConnectBtLoopProps = Base & {
    type: typeof DEVICE_ANIMATION_TYPES.CONNECT_BT_LOOP;
    deviceModelInternal: DeviceModelInternal.T3W1;
};

export type DeviceAnimationProps =
    | RotateProps
    | BootloaderProps
    | BootloaderTwoButtonsOrNormalProps
    | HologramProps
    | ConnectCableProps
    | ConnectBtIntroProps
    | ConnectBtLoopProps;

export const DeviceAnimation = forwardRef<HTMLVideoElement, DeviceAnimationProps>(
    (props, videoRef) => {
        const {
            height,
            width,
            type,
            loop = false,
            shape,
            onVideoMouseOver: onMouseOver,
            onEnded,
            ...rest
        } = props;

        const theme = useTheme();
        const frameProps = pickAndPrepareFrameProps(rest, allowedAnimationPrimitivesFrameProps);

        const model = getNarrowedDeviceModelInternal(props.deviceModelInternal) as ModelWithDir;
        const modelDir = MODEL_DIR[model];
        const variant = getThemeVariant(theme);

        const withVariant = (base: string) => `${base}_${variant}.webm`;
        const basePath = `videos/device/${modelDir}`;

        const rerenderKey = `${modelDir}_${type.toLowerCase()}_${variant}`;
        const commonVideoProps = { loop, videoRef, onMouseOver, rerenderKey, onEnded };

        const content = (() => {
            switch (type) {
                case DEVICE_ANIMATION_TYPES.BOOTLOADER: {
                    // T3B1 has "bootloader.webm", others have "bootloader_dark|light.webm"
                    const file =
                        model === DeviceModelInternal.T3B1
                            ? 'bootloader.webm'
                            : withVariant('bootloader');

                    return <Video src={`${basePath}/${file}`} {...commonVideoProps} />;
                }

                case DEVICE_ANIMATION_TYPES.BOOTLOADER_TWO_BUTTONS: {
                    return (
                        <Video
                            src={`${basePath}/${withVariant('bootloader_two_buttons')}`}
                            {...commonVideoProps}
                        />
                    );
                }

                case DEVICE_ANIMATION_TYPES.NORMAL: {
                    return (
                        <Video src={`${basePath}/${withVariant('normal')}`} {...commonVideoProps} />
                    );
                }

                case DEVICE_ANIMATION_TYPES.HOLOGRAM: {
                    return <Video src={`${basePath}/hologram.webm`} {...commonVideoProps} />;
                }

                case DEVICE_ANIMATION_TYPES.ROTATE: {
                    type RotateOnly = Extract<
                        DeviceAnimationProps,
                        { type: typeof DEVICE_ANIMATION_TYPES.ROTATE }
                    >;
                    const { deviceUnitColor, sizeVariant } = props as RotateOnly;

                    const allowed = MODEL_ROTATE_COLORS[
                        model as ModelWithRotate
                    ] as readonly number[];
                    const color = deviceUnitColor ?? allowed[0];
                    const size =
                        MODEL_ROTATE_HAS_LARGE[model as ModelWithRotate] && sizeVariant
                            ? '_large'
                            : '';

                    return (
                        <Video
                            src={`${basePath}/rotate_color_${color}${size}.webm`}
                            {...commonVideoProps}
                        />
                    );
                }

                case DEVICE_ANIMATION_TYPES.CONNECT_CABLE: {
                    return <Video src={`${basePath}/connect_cable.webm`} {...commonVideoProps} />;
                }

                case DEVICE_ANIMATION_TYPES.CONNECT_BT_INTRO: {
                    return <Video src={`${basePath}/connect_bt.webm`} {...commonVideoProps} />;
                }

                case DEVICE_ANIMATION_TYPES.CONNECT_BT_LOOP: {
                    return <Video src={`${basePath}/connect_bt_loop.webm`} {...commonVideoProps} />;
                }
            }
        })();

        return (
            <AnimationWrapper height={height} width={width} shape={shape} {...frameProps}>
                {content}
            </AnimationWrapper>
        );
    },
);
