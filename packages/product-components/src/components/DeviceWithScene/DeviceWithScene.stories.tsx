import { type Meta, type StoryObj } from '@storybook/react';

import { getFramePropsStory } from '@trezor/components';

import {
    DeviceWithScene as DeviceWithSceneComponent,
    type DeviceWithSceneProps,
    allowedDeviceWithSceneFrameProps,
} from './DeviceWithScene';

const meta: Meta<typeof DeviceWithSceneComponent> = {
    title: 'DeviceWithScene',
    component: DeviceWithSceneComponent,
};
export default meta;

export const DeviceWithScene: StoryObj<DeviceWithSceneProps> = {
    args: {
        ...getFramePropsStory(allowedDeviceWithSceneFrameProps).args,
    },
    argTypes: {
        ...getFramePropsStory(allowedDeviceWithSceneFrameProps).argTypes,
    },
};
