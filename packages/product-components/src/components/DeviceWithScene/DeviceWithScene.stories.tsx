import { Meta, StoryObj } from '@storybook/react';

import { getFramePropsStory } from '@trezor/components';

import {
    DeviceWithScene as DeviceWithSceneComponent,
    type DeviceWithSceneProps,
    allowedDeviceWithSceneFrameProps,
} from './DeviceWithScene';

const meta: Meta = {
    title: 'DeviceWithScene',
    component: DeviceWithSceneComponent,
} as Meta;
export default meta;

export const DeviceWithScene: StoryObj<DeviceWithSceneProps> = {
    args: {
        ...getFramePropsStory(allowedDeviceWithSceneFrameProps).args,
    },
    argTypes: {
        ...getFramePropsStory(allowedDeviceWithSceneFrameProps).argTypes,
    },
};
