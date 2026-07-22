import { DeviceModelInternal } from '@trezor/device-utils';

import { DEVICE_ANIMATION_TYPES } from './deviceAnimationTypes';

export const DEVICE_ANIMATION_CONFIG = {
    [DEVICE_ANIMATION_TYPES.ROTATE]: {
        models: {
            [DeviceModelInternal.T1B1]: { colors: [1] },
            [DeviceModelInternal.T2T1]: { colors: [1] },
            [DeviceModelInternal.T2B1]: { colors: [1, 2, 3, 4, 5] },
            [DeviceModelInternal.T3B1]: { colors: [1, 2, 3, 4, 5] },
            [DeviceModelInternal.T3T1]: { colors: [1, 2, 3, 4, 5] },
            [DeviceModelInternal.T3W1]: { colors: [1, 2, 3, 4] },
        },
        hasSize: true,
    },
    [DEVICE_ANIMATION_TYPES.BOOTLOADER]: {
        models: {
            [DeviceModelInternal.T1B1]: {},
            [DeviceModelInternal.T2T1]: {},
            [DeviceModelInternal.T2B1]: {},
            [DeviceModelInternal.T3B1]: {},
        },
        hasSize: false,
    },
    [DEVICE_ANIMATION_TYPES.BOOTLOADER_TWO_BUTTONS]: {
        models: { [DeviceModelInternal.T1B1]: {} },
        hasSize: false,
    },
    [DEVICE_ANIMATION_TYPES.RECONNECT]: {
        models: { [DeviceModelInternal.T1B1]: {} },
        hasSize: false,
    },
    [DEVICE_ANIMATION_TYPES.HOLOGRAM]: {
        models: { [DeviceModelInternal.T1B1]: {} },
        hasSize: false,
    },
    [DEVICE_ANIMATION_TYPES.CONNECT_CABLE]: {
        models: { [DeviceModelInternal.T3W1]: {} },
        hasSize: false,
    },
    [DEVICE_ANIMATION_TYPES.CONNECT_BT_INTRO]: {
        models: { [DeviceModelInternal.T3W1]: {} },
        hasSize: false,
    },
    [DEVICE_ANIMATION_TYPES.CONNECT_BT_LOOP]: {
        models: { [DeviceModelInternal.T3W1]: {} },
        hasSize: false,
    },
    [DEVICE_ANIMATION_TYPES.PAIRING_MODE]: {
        models: { [DeviceModelInternal.T3W1]: {} },
        hasSize: false,
    },
} as const;

export type DeviceAnimationConfig = typeof DEVICE_ANIMATION_CONFIG;
export type AnimationType = keyof DeviceAnimationConfig;
export type ModelFor<T extends AnimationType> = keyof DeviceAnimationConfig[T]['models'];
export type ColorsFor<
    T extends AnimationType,
    M extends ModelFor<T>,
> = DeviceAnimationConfig[T]['models'][M] extends { colors: readonly number[] }
    ? DeviceAnimationConfig[T]['models'][M]['colors'][number]
    : never;
