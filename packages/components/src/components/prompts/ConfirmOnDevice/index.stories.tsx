import React from 'react';
import { ConfirmOnDevice } from './index';
import { StoryColumn } from '../../../support/Story';
import { DeviceModel } from '@trezor/device-utils';

export default {
    title: 'Misc/Prompts',
    parameters: {
        options: {
            showPanel: false,
        },
    },
};

export const Basic = () => (
    <>
        <StoryColumn minWidth={300}>
            <ConfirmOnDevice
                successText="confirmed"
                title="Confirm on T1"
                deviceModel={DeviceModel.T1}
            />
        </StoryColumn>
        <StoryColumn minWidth={300}>
            <ConfirmOnDevice
                successText="confirmed"
                title="Confirm with cancel"
                onCancel={() => {}}
                deviceModel={DeviceModel.T1}
            />
        </StoryColumn>
        <StoryColumn minWidth={300}>
            <ConfirmOnDevice
                successText="confirmed"
                title="Confirm on TT"
                deviceModel={DeviceModel.TT}
            />
        </StoryColumn>
        <StoryColumn minWidth={300}>
            <ConfirmOnDevice
                successText="confirmed"
                title="With 3 steps no active"
                steps={3}
                deviceModel={DeviceModel.TT}
            />
        </StoryColumn>
        <StoryColumn minWidth={300}>
            <ConfirmOnDevice
                successText="confirmed"
                title="With 2 steps no active"
                steps={2}
                deviceModel={DeviceModel.TT}
            />
        </StoryColumn>
        <StoryColumn minWidth={300}>
            <ConfirmOnDevice
                successText="confirmed"
                title="With 5 steps - active 4"
                steps={5}
                activeStep={4}
                deviceModel={DeviceModel.TT}
            />
        </StoryColumn>
        <StoryColumn minWidth={300}>
            <ConfirmOnDevice
                successText="confirmed"
                title="With 3 steps - active 1"
                steps={3}
                activeStep={1}
                deviceModel={DeviceModel.TT}
            />
        </StoryColumn>
        <StoryColumn minWidth={300}>
            <ConfirmOnDevice
                successText="confirmed"
                title="5 steps 3 active cancel"
                steps={5}
                activeStep={3}
                onCancel={() => {}}
                deviceModel={DeviceModel.TT}
            />
        </StoryColumn>
        <StoryColumn minWidth={300}>
            <ConfirmOnDevice
                successText="Confirmed"
                title="Confirm on TT"
                steps={5}
                activeStep={5}
                onCancel={() => {}}
                deviceModel={DeviceModel.TT}
            />
        </StoryColumn>
    </>
);
