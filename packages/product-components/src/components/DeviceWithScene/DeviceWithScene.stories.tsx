import { type Meta, type StoryObj } from '@storybook/react';

import { getFramePropsStory } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';

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
        deviceModel: DeviceModelInternal.T3W1,
    },
    argTypes: {
        ...getFramePropsStory(allowedDeviceWithSceneFrameProps).argTypes,
    },
};
