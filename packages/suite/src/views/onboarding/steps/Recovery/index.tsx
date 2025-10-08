import { isDeviceWithButtons } from '@suite-common/suite-utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { DeviceModelInternal } from '@trezor/device-utils';

import { goToNextStep, updateAnalytics } from 'src/actions/onboarding/onboardingActions';
import { OnboardingCard } from 'src/components/onboarding/OnboardingCard/OnboardingCard';
import { SelectRecoveryType, SelectRecoveryWord, SelectWordCount } from 'src/components/recovery';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useRecovery, useSelector } from 'src/hooks/suite';
import { selectIsActionAbortable } from 'src/selectors/suite/suiteSelectors';

import RecoveryStepBox from './RecoveryStepBox';

export const RecoveryStep = () => {
    const isActionAbortable = useSelector(selectIsActionAbortable);
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();

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

    const deviceModelInternal = device.features.internal_model;

    if (status === 'initial') {
        // 1. step where users chooses number of words in case of T1B1.
        // Other devices show CTA button to start the process.
        if (deviceModelInternal === DeviceModelInternal.T1B1) {
            return (
                <RecoveryStepBox
                    heading={<Translation id="TR_RECOVER_YOUR_WALLET_FROM" />}
                    description={<Translation id="TR_RECOVER_SUBHEADING_COMPUTER" />}
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

        return (
            <RecoveryStepBox
                heading={<Translation id="TR_RECOVER_YOUR_WALLET_FROM" />}
                description={
                    <Translation
                        id={
                            isDeviceWithButtons(deviceModelInternal)
                                ? 'TR_RECOVER_SUBHEADING_BUTTONS'
                                : 'TR_RECOVER_SUBHEADING_TOUCH'
                        }
                    />
                }
                innerActions={
                    <OnboardingCard.Button
                        data-testid="@onboarding/recovery/start-button"
                        onClick={recoverDevice}
                    >
                        <Translation id="TR_START_RECOVERY" />
                    </OnboardingCard.Button>
                }
            />
        );
    }

    if (status === 'select-recovery-type') {
        // 2. step: Standard recovery (user enters recovery seed word by word on host) or Advanced recovery (user types words on a device)
        const handleSelect = (type: 'standard' | 'advanced') => {
            setAdvancedRecovery(type === 'advanced');
            dispatch(updateAnalytics({ recoveryType: type }));
            recoverDevice();
        };

        return (
            <RecoveryStepBox
                heading={<Translation id="TR_SELECT_RECOVERY_METHOD" />}
                description={<Translation id="TR_RECOVERY_TYPES_DESCRIPTION" />}
            >
                <SelectRecoveryType onSelect={handleSelect} />
            </RecoveryStepBox>
        );
    }

    const subheadingTouch = <Translation id="TR_RECOVER_SUBHEADING_TOUCH" />;
    const subheadingButtons = <Translation id="TR_RECOVER_SUBHEADING_BUTTONS" />;

    if (status === 'waiting-for-confirmation') {
        // Todo: replace some feature/capability to signal, if device is button/touch
        const descriptionMap: Record<DeviceModelInternal, ReactNode> = {
            T1B1: null,
            T2B1: subheadingButtons,
            T2T1: subheadingTouch,
            T3B1: subheadingButtons,
            T3T1: subheadingTouch,
            T3W1: subheadingTouch,
            UNKNOWN: subheadingTouch,
        };

        // On T1B1 we show confirm bubble only while we wait for confirmation that users wants to start the process
        return (
            <RecoveryStepBox
                heading={<Translation id="TR_RECOVER_YOUR_WALLET_FROM" />}
                description={descriptionMap[deviceModelInternal]}
                device={device}
                isActionAbortable={isActionAbortable}
                isConfirmedOnDevice
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

        const descriptionMap: Record<DeviceModelInternal, ReactNode> = {
            // Todo: replace some feature/capability to signal, if device is button/touch
            T1B1: getModel1Description(),
            T2B1: subheadingButtons,
            T2T1: subheadingTouch,
            T3B1: subheadingButtons,
            T3T1: subheadingTouch,
            T3W1: subheadingTouch,
            UNKNOWN: subheadingTouch,
        };

        return (
            <RecoveryStepBox
                heading={<Translation id="TR_RECOVER_YOUR_WALLET_FROM" />}
                device={device}
                description={descriptionMap[deviceModelInternal]}
                isActionAbortable
                isConfirmedOnDevice
            >
                {deviceModelInternal === DeviceModelInternal.T1B1 && <SelectRecoveryWord />}
            </RecoveryStepBox>
        );
    }

    if (device && device.mode === 'normal') {
        // Ready to continue to the next step
        const handleClick = () => dispatch(goToNextStep('set-pin'));

        return (
            <RecoveryStepBox
                heading={<Translation id="TR_WALLET_RECOVERED_FROM_SEED" />}
                innerActions={
                    <OnboardingCard.Button
                        data-testid="@onboarding/recovery/continue-button"
                        onClick={handleClick}
                    >
                        <Translation id="TR_CONTINUE" />
                    </OnboardingCard.Button>
                }
            />
        );
    }
    if (status === 'finished' && error) {
        // Recovery finished with error, user is recommended to wipe the device and start over
        return (
            <RecoveryStepBox
                heading={<Translation id="TR_RECOVERY_FAILED" />}
                description={<Translation id="TR_RECOVERY_ERROR" values={{ error }} />}
                innerActions={
                    <OnboardingCard.Button
                        data-testid="@onboarding/recovery/retry-button"
                        onClick={
                            deviceModelInternal === DeviceModelInternal.T1B1
                                ? resetReducer
                                : recoverDevice
                        }
                    >
                        <Translation id="TR_RETRY" />
                    </OnboardingCard.Button>
                }
            />
        );
    }

    // We shouldn't get there, but to keep typescript sane let's return null
    return null;
};
