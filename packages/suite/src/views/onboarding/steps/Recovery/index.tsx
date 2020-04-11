import React from 'react';
import styled from 'styled-components';

import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import { SelectWordCount, SelectRecoveryType, Error } from '@recovery-components';
import { Translation, Loading, Image } from '@suite-components';
import { Props } from './Container';

const StyledImage = styled(Image)`
    flex: 1;
`;

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
    } = props;

    if (!device || !device.features) {
        return null;
    }

    const model = device.features.major_version;
    const handleBack = () => {
        if (recovery.status === 'select-recovery-type') {
            return setStatus('initial');
        }
        // allow to change recovery settings for T1 in case of error
        if (recovery.status === 'finished' && recovery.error && model === 1) {
            return setStatus('initial');
        }
        return goToPreviousStep();
    };

    const isBackButtonVisible = () => {
        if (recovery.status === 'finished' && recovery.error && model === 1) {
            return true;
        }
        if (recovery.status !== 'finished' && recovery.status !== 'in-progress') {
            return true;
        }
        return false;
    };

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
                    <SelectWordCount
                        onSelect={number => {
                            setWordsCount(number);
                            setStatus('select-recovery-type');
                        }}
                    />
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
                    </>
                )}

                {recovery.status === 'in-progress' && <Loading />}

                {recovery.status === 'finished' && !recovery.error && (
                    <>
                        <StyledImage image="UNI_SUCCESS" />
                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                data-test="@onboarding/recovery/continue-button"
                                onClick={() => goToNextStep('set-pin')}
                            >
                                <Translation id="TR_CONTINUE" />
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
                                    recoverDevice();
                                }}
                            >
                                <Translation id="TR_RETRY" />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
            </Wrapper.StepBody>

            <Wrapper.StepFooter>
                {isBackButtonVisible() && (
                    <OnboardingButton.Back onClick={() => handleBack()}>
                        <Translation id="TR_BACK" />
                    </OnboardingButton.Back>
                )}
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default RecoveryStep;
