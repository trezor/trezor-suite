import { Meta, StoryObj } from '@storybook/react';

import { DeviceModelInternal } from '@trezor/device-utils';

import {
    DEVICE_ANIMATION_TYPES,
    DeviceAnimation as DeviceAnimationComponent,
} from './DeviceAnimation';

const meta: Meta<typeof DeviceAnimationComponent> = {
    title: 'DeviceAnimation',
    component: DeviceAnimationComponent,
};
export default meta;

export const Rotate: StoryObj<typeof DeviceAnimationComponent> = {
    args: {
        height: 300,
        width: 300,
        type: DEVICE_ANIMATION_TYPES.ROTATE,
        loop: false,
        shape: undefined,
        deviceModelInternal: DeviceModelInternal.T3T1,
        deviceUnitColor: 1,
        sizeVariant: 'LARGE',
    },
    argTypes: {
        loop: { control: 'boolean' },
        deviceModelInternal: {
            control: 'select',
            options: [
                DeviceModelInternal.T1B1,
                DeviceModelInternal.T2T1,
                DeviceModelInternal.T3B1,
                DeviceModelInternal.T3T1,
                DeviceModelInternal.T3W1,
            ],
        },
        deviceUnitColor: { control: 'number' },
        sizeVariant: { control: 'select', options: ['LARGE', undefined] },
    },
};

export const Bootloader: StoryObj<typeof DeviceAnimationComponent> = {
    args: {
        height: 300,
        width: 300,
        type: DEVICE_ANIMATION_TYPES.BOOTLOADER,
        loop: false,
        shape: undefined,
        deviceModelInternal: DeviceModelInternal.T1B1,
    },
    argTypes: {
        loop: { control: 'boolean' },
        deviceModelInternal: {
            control: 'select',
            options: [DeviceModelInternal.T1B1, DeviceModelInternal.T2T1, DeviceModelInternal.T3B1],
        },
        deviceUnitColor: { table: { disable: true } },
        sizeVariant: { table: { disable: true } },
    },
};

export const BootloaderTwoButtons: StoryObj<typeof DeviceAnimationComponent> = {
    args: {
        height: 300,
        width: 300,
        type: DEVICE_ANIMATION_TYPES.BOOTLOADER_TWO_BUTTONS,
        loop: false,
        shape: undefined,
        deviceModelInternal: DeviceModelInternal.T1B1,
    },
    argTypes: {
        loop: { control: 'boolean' },
        deviceModelInternal: {
            control: 'select',
            options: [DeviceModelInternal.T1B1],
        },
        deviceUnitColor: { table: { disable: true } },
        sizeVariant: { table: { disable: true } },
    },
};

export const Normal: StoryObj<typeof DeviceAnimationComponent> = {
    args: {
        height: 300,
        width: 300,
        type: DEVICE_ANIMATION_TYPES.NORMAL,
        loop: false,
        shape: undefined,
        deviceModelInternal: DeviceModelInternal.T1B1,
    },
    argTypes: {
        loop: { control: 'boolean' },
        deviceModelInternal: {
            control: 'select',
            options: [DeviceModelInternal.T1B1],
        },
        deviceUnitColor: { table: { disable: true } },
        sizeVariant: { table: { disable: true } },
    },
};

export const Hologram: StoryObj<typeof DeviceAnimationComponent> = {
    args: {
        height: 300,
        width: 300,
        type: DEVICE_ANIMATION_TYPES.HOLOGRAM,
        loop: false,
        shape: undefined,
        deviceModelInternal: DeviceModelInternal.T1B1,
    },
    argTypes: {
        loop: { control: 'boolean' },
        deviceModelInternal: {
            control: 'select',
            options: [DeviceModelInternal.T1B1],
        },
        deviceUnitColor: { table: { disable: true } },
        sizeVariant: { table: { disable: true } },
    },
};

export const ConnectCable: StoryObj<typeof DeviceAnimationComponent> = {
    args: {
        height: 300,
        width: 300,
        type: DEVICE_ANIMATION_TYPES.CONNECT_CABLE,
        loop: false,
        shape: undefined,
        deviceModelInternal: DeviceModelInternal.T3W1,
    },
    argTypes: {
        loop: { control: 'boolean' },
        deviceModelInternal: {
            control: 'select',
            options: [DeviceModelInternal.T3W1],
        },
        deviceUnitColor: { table: { disable: true } },
        sizeVariant: { table: { disable: true } },
    },
};

export const ConnectBtIntro: StoryObj<typeof DeviceAnimationComponent> = {
    args: {
        height: 300,
        width: 300,
        type: DEVICE_ANIMATION_TYPES.CONNECT_BT_INTRO,
        loop: false,
        shape: undefined,
        deviceModelInternal: DeviceModelInternal.T3W1,
    },
    argTypes: {
        loop: { control: 'boolean' },
        deviceModelInternal: {
            control: 'select',
            options: [DeviceModelInternal.T3W1],
        },
        deviceUnitColor: { table: { disable: true } },
        sizeVariant: { table: { disable: true } },
    },
};

export const ConnectBtLoop: StoryObj<typeof DeviceAnimationComponent> = {
    args: {
        height: 300,
        width: 300,
        type: DEVICE_ANIMATION_TYPES.CONNECT_BT_LOOP,
        loop: false,
        shape: undefined,
        deviceModelInternal: DeviceModelInternal.T3W1,
    },
    argTypes: {
        loop: { control: 'boolean' },
        deviceModelInternal: {
            control: 'select',
            options: [DeviceModelInternal.T3W1],
        },
        deviceUnitColor: { table: { disable: true } },
        sizeVariant: { table: { disable: true } },
    },
};
