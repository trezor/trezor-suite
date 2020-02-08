import React from 'react';

import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import { SelectWordCount, SelectRecoveryType, Error } from '@recovery-components';
import { Translation, Loading } from '@suite-components';
import messages from '@suite/support/messages';
import { resolveStaticPath } from '@suite-utils/nextjs';

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
                            <Translation {...messages.TR_RECOVER_SUBHEADING_MODEL_T} />
                        </Text>
                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                onClick={() => {
                                    recoverDevice();
                                }}
                            >
                                <Translation {...messages.TR_START_RECOVERY} />
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
                                <Translation {...messages.TR_BACK} />
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
                        <img src={resolveStaticPath('images/suite/uni-success.svg')} alt="" />
                        <Wrapper.Controls>
                            <OnboardingButton.Cta onClick={() => goToNextStep()}>
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
                                <Translation {...messages.TR_RETRY} />
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
