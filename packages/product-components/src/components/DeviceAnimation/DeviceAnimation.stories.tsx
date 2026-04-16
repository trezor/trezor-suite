import { type Meta, type StoryObj } from '@storybook/react';

import { type DeviceModelInternal } from '@trezor/device-utils';

import { DeviceAnimation as DeviceAnimationComponent } from './DeviceAnimation';
import { DEVICE_ANIMATION_CONFIG } from './deviceAnimationConfig';
import { DEVICE_ANIMATION_TYPES } from './deviceAnimationTypes';

const createDeviceAnimationStory = (
    type: keyof typeof DEVICE_ANIMATION_TYPES,
): StoryObj<typeof DeviceAnimationComponent> => {
    const animationType = DEVICE_ANIMATION_TYPES[type];
    const config = DEVICE_ANIMATION_CONFIG[animationType];
    const modelEntries = Object.entries(config.models) as [DeviceModelInternal, any][];
    const firstEntry = modelEntries[0];
    if (!firstEntry) {
        return { args: {} as any };
    }
    const [firstModel, firstModelCfg] = firstEntry;
    const colors: number[] = (firstModelCfg?.colors as number[]) ?? [1];
    const hasSize = (config as { hasSize?: boolean }).hasSize ?? false;

    return {
        args: {
            height: 300,
            width: 300,
            type: animationType,
            loop: false,
            shape: undefined,
            deviceModelInternal: firstModel,
            deviceUnitColor: colors[0],
            sizeVariant: hasSize ? 'LARGE' : undefined,
        } as any,
        argTypes: {
            loop: { control: 'boolean' },
            deviceModelInternal: {
                control: 'select',
                options: modelEntries.map(([m]) => m),
            },
            deviceUnitColor: colors.length
                ? { control: 'select', options: colors }
                : { table: { disable: true } },
            sizeVariant: hasSize
                ? { control: 'select', options: ['LARGE', undefined] }
                : { table: { disable: true } },
        },
    };
};

const meta: Meta<typeof DeviceAnimationComponent> = {
    title: 'DeviceAnimation',
    component: DeviceAnimationComponent,
};
export default meta;

export const Rotate = createDeviceAnimationStory('ROTATE');
export const Bootloader = createDeviceAnimationStory('BOOTLOADER');
export const BootloaderTwoButtons = createDeviceAnimationStory('BOOTLOADER_TWO_BUTTONS');
export const Reconnect = createDeviceAnimationStory('RECONNECT');
export const Hologram = createDeviceAnimationStory('HOLOGRAM');
export const ConnectCable = createDeviceAnimationStory('CONNECT_CABLE');
export const ConnectBtIntro = createDeviceAnimationStory('CONNECT_BT_INTRO');
export const ConnectBtLoop = createDeviceAnimationStory('CONNECT_BT_LOOP');
export const PairingMode = createDeviceAnimationStory('PAIRING_MODE');
