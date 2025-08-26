import { Meta, StoryObj } from '@storybook/react';

import { DeviceModelInternal } from '@trezor/device-utils';

import {
    DeviceAnimation as DeviceAnimationComponent,
    animationDeviceTypes,
} from './DeviceAnimation';

const meta: Meta = {
    title: 'DeviceAnimation',
    component: DeviceAnimationComponent,
} as Meta;
export default meta;

export const DeviceAnimation: StoryObj<typeof DeviceAnimationComponent> = {
    args: {
        height: 300,
        width: 300,
        type: 'BOOTLOADER',
        loop: false,
        shape: 'CIRCLE',
        deviceModelInternal: DeviceModelInternal.T1B1,
        isOldT2B1Packaging: true,
        deviceUnitColor: 1,
        sizeVariant: 'LARGE',
    },
    argTypes: {
        loop: {
            control: 'boolean',
        },
        isOldT2B1Packaging: {
            control: 'boolean',
        },
        type: {
            control: 'select',
            options: ['undefined', ...animationDeviceTypes],
        },
    },
};
