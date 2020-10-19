import React from 'react';

import { OnboardingButton, Wrapper } from '@onboarding-components';
import { Translation } from '@suite-components';
import {
    CheckSeedStep,
    FirmwareProgressStep,
    PartiallyDoneStep,
    DoneStep,
    ErrorStep,
    ReconnectInBootloaderStep,
    ReconnectInNormalStep,
    NoNewFirmware,
    OnboardingInitialStep,
    ContinueButton,
    RetryButton,
} from '@firmware-components';

import { Props } from './Container';

const FirmwareStep = ({
    device,
    firmware,
    goToPreviousStep,
    goToNextStep,
    resetReducer,
    firmwareUpdate,
}: Props) => {
    const getComponent = () => {
        // edge case 1 - error
        if (firmware.error) {
            return {
                Body: <ErrorStep.Body />,
                BottomBar: <RetryButton onClick={firmwareUpdate} />,
            };
        }

        // // edge case 2 - user has reconnected device that is already up to date
        if (firmware.status !== 'done' && device?.firmware === 'valid') {
            return {
                Body: <NoNewFirmware.Body />,
                BottomBar: <ContinueButton onClick={() => goToNextStep()} />,
            };
        }

        switch (firmware.status) {
            case 'initial':
                return {
                    Body: <OnboardingInitialStep.Body />,
                    BottomBar: <OnboardingInitialStep.BottomBar />,
                };
            case 'check-seed':
                return {
                    Body: <CheckSeedStep.Body />,
                    BottomBar: <CheckSeedStep.BottomBar />,
                };
            case 'waiting-for-bootloader':
                return {
                    Body: <ReconnectInBootloaderStep.Body />,
                    BottomBar: <ReconnectInBootloaderStep.BottomBar />,
                };
            case 'waiting-for-confirmation':
            case 'installing':
            case 'started':
            case 'check-fingerprint':
            case 'wait-for-reboot':
            case 'unplug':
                return {
                    Body: <FirmwareProgressStep.Body />,
                    BottomBar: null,
                };
            case 'reconnect-in-normal':
                return {
                    Body: <ReconnectInNormalStep.Body />,
                    BottomBar: <ReconnectInNormalStep.BottomBar />,
                };
            case 'partially-done':
                return {
                    Body: <PartiallyDoneStep.Body />,
                    BottomBar: <ContinueButton onClick={resetReducer} />,
                };
            case 'done':
                return {
                    Body: <DoneStep.Body />,
                    BottomBar: <ContinueButton onClick={() => goToNextStep()} />,
                };

            default:
                // 'ensure' type completeness
                throw new Error(`state "${firmware.status}" is not handled here`);
        }
    };

    const Component = getComponent();

    return (
        <Wrapper.Step>
            <Wrapper.StepBody>
                {Component.Body}
                <Wrapper.Controls>{Component.BottomBar}</Wrapper.Controls>
            </Wrapper.StepBody>

            <Wrapper.StepFooter>
                {['initial', 'error'].includes(firmware.status) && (
                    <OnboardingButton.Back
                        onClick={() =>
                            firmware.status === 'error' ? resetReducer() : goToPreviousStep()
                        }
                    >
                        <Translation id="TR_BACK" />
                    </OnboardingButton.Back>
                )}
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default FirmwareStep;
