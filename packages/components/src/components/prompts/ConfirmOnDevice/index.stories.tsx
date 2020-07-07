import React from 'react';
import { ConfirmOnDevice } from './index';
import { storiesOf } from '@storybook/react';
import { StoryColumn } from '../../../support/Story';

storiesOf('Prompts', module).add(
    'Confirm On Device',
    () => {
        return (
            <>
                <StoryColumn minWidth={300}>
                    <ConfirmOnDevice title="Confirm on Trezor T1" trezorModel="T1" />
                </StoryColumn>
                <StoryColumn minWidth={300}>
                    <ConfirmOnDevice
                        title="Confirm with cancel"
                        onCancel={() => {}}
                        trezorModel="T1"
                    />
                </StoryColumn>
                <StoryColumn minWidth={300}>
                    <ConfirmOnDevice title="Confirm on Trezor T2" trezorModel="T2" />
                </StoryColumn>
                <StoryColumn minWidth={300}>
                    <ConfirmOnDevice title="With 3 steps no active" steps={3} trezorModel="T2" />
                </StoryColumn>
                <StoryColumn minWidth={300}>
                    <ConfirmOnDevice title="With 2 steps no active" steps={2} trezorModel="T2" />
                </StoryColumn>
                <StoryColumn minWidth={300}>
                    <ConfirmOnDevice
                        title="With 5 steps - active 4"
                        steps={5}
                        activeStep={4}
                        trezorModel="T2"
                    />
                </StoryColumn>
                <StoryColumn minWidth={300}>
                    <ConfirmOnDevice
                        title="With 3 steps - active 1"
                        steps={3}
                        activeStep={1}
                        trezorModel="T2"
                    />
                </StoryColumn>
                <StoryColumn minWidth={300}>
                    <ConfirmOnDevice
                        title="5 steps 3 active cancel"
                        steps={5}
                        activeStep={3}
                        onCancel={() => {}}
                        trezorModel="T2"
                    />
                </StoryColumn>
            </>
        );
    },
    {
        options: {
            showPanel: false,
        },
    }
);
