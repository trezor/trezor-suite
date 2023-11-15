import { Meta, StoryFn } from '@storybook/react';
import { DeviceModelInternal } from '@trezor/connect';
import { ConfirmOnDevice as ConfirmOnDeviceComponent } from './ConfirmOnDevice';
import { StoryColumn } from '../../support/Story';

export default {
    title: 'Misc/ConfirmOnDevice',
    parameters: {
        options: {
            showPanel: false,
        },
    },
} as Meta;

export const ConfirmOnDevice: StoryFn = () => (
    <>
        <StoryColumn minWidth={300}>
            <ConfirmOnDeviceComponent
                successText="confirmed"
                title="Confirm on T1B1"
                deviceModelInternal={DeviceModelInternal.T1B1}
            />
        </StoryColumn>
        <StoryColumn minWidth={300}>
            <ConfirmOnDeviceComponent
                successText="confirmed"
                title="Confirm with cancel"
                onCancel={() => {}}
                deviceModelInternal={DeviceModelInternal.T1B1}
            />
        </StoryColumn>
        <StoryColumn minWidth={300}>
            <ConfirmOnDeviceComponent
                successText="confirmed"
                title="Confirm on T2T1"
                deviceModelInternal={DeviceModelInternal.T2T1}
            />
        </StoryColumn>
        <StoryColumn minWidth={300}>
            <ConfirmOnDeviceComponent
                successText="confirmed"
                title="With 3 steps no active"
                steps={3}
                deviceModelInternal={DeviceModelInternal.T2B1}
                deviceUnitColor={1}
            />
        </StoryColumn>
        <StoryColumn minWidth={300}>
            <ConfirmOnDeviceComponent
                successText="confirmed"
                title="With 2 steps no active"
                steps={2}
                deviceModelInternal={DeviceModelInternal.T2B1}
                deviceUnitColor={2}
            />
        </StoryColumn>
        <StoryColumn minWidth={300}>
            <ConfirmOnDeviceComponent
                successText="confirmed"
                title="With 5 steps - active 4"
                steps={5}
                activeStep={4}
                deviceModelInternal={DeviceModelInternal.T2B1}
                deviceUnitColor={3}
            />
        </StoryColumn>
        <StoryColumn minWidth={300}>
            <ConfirmOnDeviceComponent
                successText="confirmed"
                title="With 3 steps - active 1"
                steps={3}
                activeStep={1}
                deviceModelInternal={DeviceModelInternal.T2B1}
                deviceUnitColor={4}
            />
        </StoryColumn>
        <StoryColumn minWidth={300}>
            <ConfirmOnDeviceComponent
                successText="confirmed"
                title="5 steps 3 active cancel"
                steps={5}
                activeStep={3}
                onCancel={() => {}}
                deviceModelInternal={DeviceModelInternal.T2T1}
                deviceUnitColor={5}
            />
        </StoryColumn>
        <StoryColumn minWidth={300}>
            <ConfirmOnDeviceComponent
                successText="Confirmed"
                title="Confirm on T2T1"
                steps={5}
                activeStep={5}
                onCancel={() => {}}
                deviceModelInternal={DeviceModelInternal.T2T1}
            />
        </StoryColumn>
    </>
);
