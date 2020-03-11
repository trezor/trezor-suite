import React from 'react';

import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import { SelectWordCount, SelectRecoveryType, Error } from '@recovery-components';
import { Translation, Loading, Image } from '@suite-components';

import { Props } from './Container';

const RecoveryStep = (props: Props) => {
    const {
        goToNextStep,
        goToPreviousStep,
        setWordsCount,
        setAdvancedRecovery,
        setStatus,
        recoverDevice,
        recovery,
        device,
        // modal,
        resetReducer,
    } = props;

    if (!device || !device.features) {
        return null;
    }

    const model = device.features.major_version;

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                {recovery.status === 'initial' && 'Recover your device from seed'}
                {recovery.status === 'select-recovery-type' && 'Select recovery method'}
                {recovery.status === 'finished' && !recovery.error && 'Device recovered from seed'}
                {recovery.status === 'finished' && recovery.error && 'Recovery failed'}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {recovery.status === 'initial' && model === 1 && (
                    <>
                        <SelectWordCount
                            onSelect={number => {
                                setWordsCount(number);
                                setStatus('select-recovery-type');
                            }}
                        />
                    </>
                )}

                {recovery.status === 'initial' && model === 2 && (
                    <>
                        <Text>
                            <Translation id="TR_RECOVER_SUBHEADING_MODEL_T" />
                        </Text>
                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                data-test="@onboarding/recovery/start-button"
                                onClick={() => {
                                    recoverDevice();
                                }}
                            >
                                <Translation id="TR_START_RECOVERY" />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
                {recovery.status === 'select-recovery-type' && (
                    <>
                        <SelectRecoveryType
                            onSelect={(type: boolean) => {
                                setAdvancedRecovery(type);
                                recoverDevice();
                            }}
                        />

                        <Wrapper.Controls>
                            <OnboardingButton.Alt
                                onClick={() => {
                                    setStatus('initial');
                                }}
                            >
                                <Translation id="TR_BACK" />
                            </OnboardingButton.Alt>
                        </Wrapper.Controls>
                    </>
                )}

                {recovery.status === 'in-progress' && (
                    // <>
                    //     {!modal && <Loading />}
                    //     {modal && modal}
                    // </>
                    <Loading />
                )}

                {recovery.status === 'finished' && !recovery.error && (
                    <>
                        <Image image="UNI_SUCCESS" />
                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                data-test="@onboarding/recovery/continue-button"
                                onClick={() => goToNextStep('set-pin')}
                            >
                                Continue
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
                {recovery.status === 'finished' && recovery.error && (
                    <>
                        <Error error={recovery.error} />
                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                onClick={() => {
                                    resetReducer();
                                }}
                            >
                                <Translation id="TR_RETRY" />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
            </Wrapper.StepBody>

            <Wrapper.StepFooter>
                {recovery.status !== 'in-progress' && (
                    <OnboardingButton.Back onClick={() => goToPreviousStep()}>
                        Back
                    </OnboardingButton.Back>
                )}
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default RecoveryStep;
