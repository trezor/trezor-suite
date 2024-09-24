import { Meta, StoryObj } from '@storybook/react';
import {
    RotateDeviceImage as RotateDeviceImageComponent,
    RotateDeviceImageProps,
} from './RotateDeviceImage';
import { DeviceModelInternal } from '@trezor/connect';

const meta: Meta = {
    title: 'RotateDeviceImage',
    component: RotateDeviceImageComponent,
} as Meta;
export default meta;

export const RotateDeviceImage: StoryObj<RotateDeviceImageProps> = {
    args: {
        deviceModel: DeviceModelInternal.T3B1,
        deviceColor: undefined,
        animationHeight: undefined,
        animationWidth: undefined,
    },
    argTypes: {
        deviceModel: {
            options: DeviceModelInternal,
            control: {
                type: 'select',
            },
        },
        deviceColor: {
            type: 'string',
        },
    },
};
