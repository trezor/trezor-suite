import { Meta, StoryObj } from '@storybook/react';

import { allowedAnimationPrimitivesFrameProps, getFramePropsStory } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';

import {
    RotateDeviceImage as RotateDeviceImageComponent,
    RotateDeviceImageProps,
} from './RotateDeviceImage';

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
        ...getFramePropsStory(allowedAnimationPrimitivesFrameProps).args,
    },
    argTypes: {
        deviceModel: {
            options: Object.values(DeviceModelInternal),
            control: {
                type: 'select',
                labels: DeviceModelInternal,
            },
        },
        deviceColor: {
            type: 'string',
        },
        ...getFramePropsStory(allowedAnimationPrimitivesFrameProps).argTypes,
    },
};
