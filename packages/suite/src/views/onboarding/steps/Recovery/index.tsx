import React from 'react';
import TrezorConnect from '@trezor/connect';
import { OnboardingButtonCta } from '@onboarding-components';
import { SelectWordCount, SelectRecoveryType, SelectRecoveryWord } from '@recovery-components';
import { Translation } from '@suite-components';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import { useActions, useRecovery, useSelector } from '@suite-hooks';
import RecoveryStepBox from './RecoveryStepBox';

export const RecoveryStep = () => {
    const { goToNextStep, updateAnalytics } = useActions({
        goToNextStep: onboardingActions.goToNextStep,
        updateAnalytics: onboardingActions.updateAnalytics,
    });

    const { device } = useSelector(state => ({
        device: state.suite.device,
    }));

    const {
        status,
        error,
        wordRequestInputType,
        setWordsCount,
        setAdvancedRecovery,
        recoverDevice,
        setStatus,
        resetReducer,
    } = useRecovery();

    if (!device || !device.features) {
        return null;
    }

    const model = device.features.major_version;

    if (status === 'initial') {
        // 1. step where users chooses number of words in case of T1
        // In case of model T show CTA button to start the process
        if (model === 1) {
            // Model 1
            return (
                <RecoveryStepBox
                    key={status} // to properly rerender in translation mode
                    heading={<Translation id="TR_RECOVER_YOUR_WALLET_FROM" />}
                    description={<Translation id="TR_RECOVER_SUBHEADING" />}
                >
                    <SelectWordCount
                        onSelect={number => {
                            setWordsCount(number);
                            setStatus('select-recovery-type');
                        }}
                    />
                </RecoveryStepBox>
            );
        }

        // Model T
        return (
            <RecoveryStepBox
                key={status} // to properly rerender in translation mode
                heading={<Translation id="TR_RECOVER_YOUR_WALLET_FROM" />}
                description={<Translation id="TR_RECOVER_SUBHEADING_MODEL_T" />}
                innerActions={
                    <OnboardingButtonCta
                        data-test="@onboarding/recovery/start-button"
                        onClick={recoverDevice}
                    >
                        <Translation id="TR_START_RECOVERY" />
                    </OnboardingButtonCta>
                }
            />
        );
    }

    if (status === 'select-recovery-type') {
        // 2. step: Standard recovery (user enters recovery seed word by word on host) or Advanced recovery (user types words on a device)
        return (
            <RecoveryStepBox
                key={status} // to properly rerender in translation mode
                heading={<Translation id="TR_SELECT_RECOVERY_METHOD" />}
                description={<Translation id="TR_RECOVERY_TYPES_DESCRIPTION" />}
            >
                <SelectRecoveryType
                    onSelect={(type: 'standard' | 'advanced') => {
                        setAdvancedRecovery(type === 'advanced');
                        updateAnalytics({ recoveryType: type });
                        recoverDevice();
                    }}
                />
            </RecoveryStepBox>
        );
    }

    if (status === 'waiting-for-confirmation') {
        // On model 1 we show confirm bubble only while we wait for confirmation that users wants to start the process
        return (
            <RecoveryStepBox
                key={status} // to properly rerender in translation mode
                heading={<Translation id="TR_RECOVER_YOUR_WALLET_FROM" />}
                description={
                    model === 1 ? undefined : <Translation id="TR_RECOVER_SUBHEADING_MODEL_T" />
                }
                confirmOnDevice={model}
            />
        );
    }

    if (status === 'in-progress') {
        const getModel1Description = () => {
            if (wordRequestInputType === 'plain') {
                return (
                    <>
                        <Translation id="TR_ENTER_SEED_WORDS_INSTRUCTION" />{' '}
                        <Translation id="TR_RANDOM_SEED_WORDS_DISCLAIMER" />
                    </>
                );
            }

            if (wordRequestInputType === 6 || wordRequestInputType === 9) {
                return <Translation id="TR_ADVANCED_RECOVERY_TEXT" />;
            }
        };

        return (
            <RecoveryStepBox
                key={status} // to properly rerender in translation mode
                heading={<Translation id="TR_RECOVER_YOUR_WALLET_FROM" />}
                confirmOnDevice={model}
                innerActions={
                    <OnboardingButtonCta
                        onClick={() => TrezorConnect.cancel()}
                        icon="CANCEL"
                        variant="danger"
                    >
                        <Translation id="TR_ABORT" />
                    </OnboardingButtonCta>
                }
                description={
                    model === 1 ? (
                        getModel1Description()
                    ) : (
                        <Translation id="TR_RECOVER_SUBHEADING_MODEL_T" />
                    )
                }
            >
                <SelectRecoveryWord />
            </RecoveryStepBox>
        );
    }

    if (device && device.mode === 'normal') {
        // Ready to continue to the next step
        return (
            <RecoveryStepBox
                key={status} // to properly rerender in translation mode
                heading={<Translation id="TR_WALLET_RECOVERED_FROM_SEED" />}
                innerActions={
                    <OnboardingButtonCta
                        data-test="@onboarding/recovery/continue-button"
                        onClick={() => goToNextStep('set-pin')}
                    >
                        <Translation id="TR_CONTINUE" />
                    </OnboardingButtonCta>
                }
            />
        );
    }
    if (status === 'finished' && error) {
        // Recovery finished with error, user is recommended to wipe the device and start over
        return (
            <RecoveryStepBox
                key={status} // to properly rerender in translation mode
                heading={<Translation id="TR_RECOVERY_FAILED" />}
                description={<Translation id="TR_RECOVERY_ERROR" values={{ error }} />}
                innerActions={
                    <OnboardingButtonCta
                        data-test="@onboarding/recovery/retry-button"
                        onClick={model === 1 ? resetReducer : recoverDevice}
                    >
                        <Translation id="TR_RETRY" />
                    </OnboardingButtonCta>
                }
            />
        );
    }

    // We shouldn't get there, but to keep typescript sane let's return null
    return null;
};
