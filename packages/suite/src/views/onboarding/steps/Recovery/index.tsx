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
        resetReducer,
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
        if (recovery.status === 'finished' && recovery.error) {
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
                {recovery.status === 'initial' && <Translation id="TR_RECOVER_YOUR_WALLET_FROM" />}
                {recovery.status === 'select-recovery-type' && (
                    <Translation id="TR_SELECT_RECOVERY_METHOD" />
                )}
                {device && device.mode === 'normal' && (
                    <Translation id="TR_WALLET_RECOVERED_FROM_SEED" />
                )}
                {recovery.status === 'finished' && recovery.error && (
                    <Translation id="TR_RECOVERY_FAILED" />
                )}
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
                        <StyledImage image="RECOVER_FROM_SEED" width="200px" />
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

                {recovery.status === 'in-progress' && <Loading noBackground />}

                {device && device.mode === 'normal' && (
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
                                data-test="@onboarding/recovery/retry-button"
                                onClick={model === 1 ? resetReducer : recoverDevice}
                            >
                                <Translation id="TR_RETRY" />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
            </Wrapper.StepBody>

            <Wrapper.StepFooter>
                {isBackButtonVisible() && (
                    <OnboardingButton.Back
                        onClick={() => handleBack()}
                        data-test="@onboarding/recovery/back-button"
                    >
                        <Translation id="TR_BACK" />
                    </OnboardingButton.Back>
                )}
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default RecoveryStep;
