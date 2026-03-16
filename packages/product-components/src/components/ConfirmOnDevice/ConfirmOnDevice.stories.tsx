import { type Meta, type StoryObj } from '@storybook/react';

// todo: product-components should not depend on protobuf
import { DeviceModelInternal } from '@trezor/device-utils';

import { ConfirmOnDevicePill as ConfirmOnDeviceComponent } from './ConfirmOnDevicePill';

const meta: Meta<typeof ConfirmOnDeviceComponent> = {
    title: 'ConfirmOnDevice',
    component: ConfirmOnDeviceComponent,
};
export default meta;

export const ConfirmOnDevice: StoryObj<typeof ConfirmOnDeviceComponent> = {
    args: {
        title: 'Confirm on T1B1',
        successText: 'Success',
        steps: undefined,
        activeStep: undefined,
        isConfirmed: false,
        onCancel: () => {},
        deviceModelInternal: DeviceModelInternal.T1B1,
    },
    argTypes: {
        title: { control: 'text' },
        successText: { control: 'text' },
        steps: { control: 'number' },
        activeStep: { control: 'number' },
        isConfirmed: { control: 'boolean' },
        onCancel: { action: 'onCancel' },
        deviceModelInternal: { control: 'select', options: Object.values(DeviceModelInternal) },
    },
};
