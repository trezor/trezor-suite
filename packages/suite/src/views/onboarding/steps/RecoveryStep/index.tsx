import { Translation, TranslationKey } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { isDeviceWithButtonOnlyNoTouchscreen } from '@suite-common/suite-utils';
import { Column } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';
import { HELP_CENTER_ADVANCED_RECOVERY_URL } from '@trezor/urls';

import { goToNextStep, updateAnalytics } from 'src/actions/onboarding/onboardingActions';
import { OnboardingCard } from 'src/components/onboarding/OnboardingCard/OnboardingCard';
import { SelectRecoveryType, SelectRecoveryWord, SelectWordCount } from 'src/components/recovery';
import { TrezorLink } from 'src/components/suite';
import { useDispatch, useRecovery, useSelector } from 'src/hooks/suite';
import { isStandardRecoveryDisabled } from 'src/utils/suite/recovery';

import RecoveryStepBox from './RecoveryStepBox';

export const RecoveryStep = () => {
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();

    const {
        status,
        error,
        wordsCount,
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
    const subheadingKey: TranslationKey = isDeviceWithButtonOnlyNoTouchscreen(deviceModelInternal)
        ? 'TR_RECOVER_SUBHEADING_BUTTONS'
        : 'TR_RECOVER_SUBHEADING_TOUCH';

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
                            // For T1B1 with 12 or 18 words, skip recovery type selection and use Advanced recovery
                            // For 24 words, show the recovery type selection
                            const shouldSkipSelection = isStandardRecoveryDisabled(
                                deviceModelInternal,
                                number,
                                'standard',
                            );

                            if (shouldSkipSelection) {
                                setAdvancedRecovery(true);
                                dispatch(updateAnalytics({ recoveryType: 'advanced' }));
                                recoverDevice();
                            } else {
                                setStatus('select-recovery-type');
                            }
                        }}
                    />
                </RecoveryStepBox>
            );
        }

        return (
            <RecoveryStepBox
                heading={<Translation id="TR_RECOVER_YOUR_WALLET_FROM" />}
                description={<Translation id={subheadingKey} />}
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
                description={
                    deviceModelInternal === DeviceModelInternal.T1B1 && wordsCount === 24 ? (
                        <Translation
                            id="TR_RECOVERY_TYPES_DESCRIPTION_24_T1B1_ONLY"
                            values={{
                                a: chunks => (
                                    <TrezorLink href={HELP_CENTER_ADVANCED_RECOVERY_URL}>
                                        {chunks}
                                    </TrezorLink>
                                ),
                            }}
                        />
                    ) : (
                        <Translation id="TR_RECOVERY_TYPES_DESCRIPTION" />
                    )
                }
            >
                <SelectRecoveryType onSelect={handleSelect} />
            </RecoveryStepBox>
        );
    }

    if (status === 'waiting-for-confirmation') {
        // On T1B1 we show confirm bubble only while we wait for confirmation that users wants to start the process
        return (
            <RecoveryStepBox
                heading={<Translation id="TR_RECOVER_YOUR_WALLET_FROM" />}
                description={
                    deviceModelInternal === DeviceModelInternal.T1B1 ? null : (
                        <Translation id={subheadingKey} />
                    )
                }
                device={device}
                isActionAbortable
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

        return (
            <RecoveryStepBox
                heading={<Translation id="TR_RECOVER_YOUR_WALLET_FROM" />}
                device={device}
                description={
                    deviceModelInternal === DeviceModelInternal.T1B1 ? (
                        getModel1Description()
                    ) : (
                        <Translation id={subheadingKey} />
                    )
                }
                isActionAbortable
                isConfirmedOnDevice
            >
                {deviceModelInternal === DeviceModelInternal.T1B1 && (
                    <Column alignItems="center">
                        <SelectRecoveryWord />
                    </Column>
                )}
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
        return (
            <RecoveryStepBox
                heading={<Translation id="TR_RECOVERY_FAILED" />}
                description={<Translation id="TR_RECOVERY_ERROR" values={{ error }} />}
                variant="destructive"
                innerActions={
                    <OnboardingCard.Button
                        data-testid="@onboarding/recovery/retry-button"
                        onClick={
                            deviceModelInternal === DeviceModelInternal.T1B1
                                ? resetReducer
                                : recoverDevice
                        }
                        intent="critical"
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
