import { useCallback, useState } from 'react';

import { canContinue } from '@suite/backup';
import { Translation } from '@suite/intl';
import { CreateNfcBackup, NoNfcTags } from '@suite/nfc';
import { OnboardingCard } from '@suite/onboarding-components';
import { goto } from '@suite/router';
import { selectIsDeviceBackupRequired, selectSelectedDevice } from '@suite-common/device';
import { Badge, Column } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { resetDevice } from 'src/actions/settings/deviceSettingsActions';
import { BackupSeedCards } from 'src/components/backup';
import { SkipStepConfirmation } from 'src/components/onboarding/SkipStepConfirmation';
import { ConfirmActionModal } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/ConfirmActionModal';
import { useDevice, useDispatch, useOnboarding, useSelector } from 'src/hooks/suite';

type SecurityStepStatus = 'initial' | 'in-progress' | 'skipping-backup' | 'finished';

type ResetDeviceParams = NonNullable<Parameters<typeof resetDevice>[0]>;

export const SecurityStep = () => {
    const [status, setStatus] = useState<SecurityStepStatus>('initial');
    const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
    const {
        goToNextStep,
        goToPreviousStep,
        updateAnalytics,
        updateBackupMedium,
        backupType,
        backupMedium,
    } = useOnboarding();
    const { isLocked } = useDevice();
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();
    const backup = useSelector(state => state.backup);
    const isDeviceLocked = isLocked();
    const isBackupRequired = useSelector(selectIsDeviceBackupRequired);
    const isNfcBackup = backupMedium === 'nfc';

    const getResetDeviceParams = useCallback(
        (skipBackup: boolean = false): ResetDeviceParams => {
            // All types use skip_backup: false — wallet creation + backup is atomic,
            // matching native device onboarding. If backup fails, device wipes itself.
            const params = (() => {
                switch (backupType) {
                    case 'shamir-single':
                        // Slip39_Single_Extendable — firmware handles single-share Shamir natively,
                        // shows "20 words" without asking for shares/threshold.
                        return { backup_type: 3 as const, skip_backup: skipBackup };
                    case 'shamir-advanced':
                        return { backup_type: 1 as const, skip_backup: skipBackup };
                    case '12-words':
                        return { backup_type: 0 as const, strength: 128, skip_backup: skipBackup };
                    case '24-words':
                        return { backup_type: 0 as const, strength: 256, skip_backup: skipBackup };
                    default:
                        return exhaustive(backupType);
                }
            })();

            if (isNfcBackup) {
                // obviously NFC backup works only for SLIP39
                return {
                    ...params,
                    backup_method: 1,
                    backup_type: 1 as const,
                };
            }

            return params;
        },
        [backupType, isNfcBackup],
    );

    const handleStart = useCallback(async () => {
        updateAnalytics({ backup: 'create' });
        setStatus('in-progress');

        // Wallet creation + backup in one atomic call, same as native device onboarding.
        // If backup fails, the device wipes itself (skip_backup: false).
        const result = await dispatch(resetDevice(getResetDeviceParams()));

        if (result?.success) {
            setStatus('finished');
        } else {
            // TODO: why should we go to the default dashboard when there is an error??
            dispatch(goto({ routeName: 'suite-index' }));
        }
    }, [dispatch, getResetDeviceParams, updateAnalytics]);

    const handleSkipBackup = useCallback(
        async ({ showFinishedScreen = false }: { showFinishedScreen?: boolean } = {}) => {
            updateAnalytics({ backup: 'skip' });
            setShowSkipConfirmation(false);
            setStatus('skipping-backup');
            const result = await dispatch(resetDevice(getResetDeviceParams(true)));
            if (result?.success) {
                if (showFinishedScreen) {
                    setStatus('finished');
                } else {
                    goToNextStep('set-pin');
                }
            } else {
                dispatch(goto({ routeName: 'suite-index' }));
            }
        },
        [dispatch, getResetDeviceParams, goToNextStep, updateAnalytics],
    );

    if (status === 'initial') {
        if (isNfcBackup) {
            return (
                <CreateNfcBackup onBack={() => goToPreviousStep()} onCreateBackup={handleStart} />
            );
        }

        if (backupMedium === null) {
            return (
                <NoNfcTags
                    onBack={() => goToPreviousStep()}
                    onFinishSetup={() => handleSkipBackup({ showFinishedScreen: true })}
                    onCreateWordlistBackup={() => updateBackupMedium('wordlist')}
                />
            );
        }

        return (
            <>
                {showSkipConfirmation && (
                    <SkipStepConfirmation
                        onCancel={() => setShowSkipConfirmation(false)}
                        onConfirm={handleSkipBackup}
                    />
                )}
                <OnboardingCard
                    iconName="trezorBackup"
                    heading={
                        <Column gap={8} alignItems="center" justifyContent="center">
                            <Badge intent="neutral" size="medium">
                                <Translation id="TR_NEW_WALLET" />
                            </Badge>
                            <Translation id="TR_CREATE_BACKUP" />
                        </Column>
                    }
                    description={<Translation id="TR_ONBOARDING_BACKUP_SUBHEADING" />}
                    innerActions={
                        <OnboardingCard.Button
                            data-testid="@onboarding/create-backup-button"
                            onClick={handleStart}
                            isDisabled={!canContinue(backup.userConfirmed, isDeviceLocked)}
                        >
                            <Translation id="TR_START_BACKUP" />
                        </OnboardingCard.Button>
                    }
                    outerActions={
                        <OnboardingCard.SecondaryButton
                            onClick={() => setShowSkipConfirmation(true)}
                            data-testid="@onboarding/skip-backup"
                        >
                            <Translation id="TR_SKIP_BACKUP" />
                        </OnboardingCard.SecondaryButton>
                    }
                >
                    <BackupSeedCards />
                </OnboardingCard>
            </>
        );
    }

    if (status === 'finished') {
        if (isBackupRequired) {
            return (
                <OnboardingCard
                    iconName="warning"
                    heading={<Translation id="TR_WALLET_CREATED_NOT_SECURED" />}
                    description={<Translation id="TR_WALLET_CREATED_NOT_SECURED_DESCRIPTION" />}
                    variant="warning"
                    innerActions={
                        <OnboardingCard.Button
                            data-testid="@onboarding/continue-button"
                            onClick={() => goToNextStep()}
                        >
                            <Translation id="TR_CONTINUE_TO_PIN" />
                        </OnboardingCard.Button>
                    }
                />
            );
        }

        return (
            <OnboardingCard
                iconName="check"
                heading={<Translation id="TR_BACKUP_CREATED" />}
                description={<Translation id="TR_BACKUP_FINISHED_TEXT" />}
                innerActions={
                    <OnboardingCard.Button
                        data-testid="@onboarding/continue-button"
                        onClick={() => goToNextStep()}
                    >
                        <Translation id="TR_BACKUP_FINISHED_BUTTON" />
                    </OnboardingCard.Button>
                }
            />
        );
    }

    // In-progress: wallet creation or backup running on device
    if (status === 'skipping-backup') {
        if (backupMedium === null && device) {
            return (
                <>
                    <NoNfcTags
                        onBack={() => goToPreviousStep()}
                        onFinishSetup={() => handleSkipBackup({ showFinishedScreen: true })}
                        onCreateWordlistBackup={() => updateBackupMedium('wordlist')}
                    />
                    <ConfirmActionModal device={device} enableBackdropClick={false} />
                </>
            );
        }

        return (
            <OnboardingCard
                iconName="wallet"
                heading={<Translation id="TR_CREATE_WALLET" />}
                description={
                    <Translation
                        id="TR_ONBOARDING_WILL_CREATE_BACKUP_TYPE"
                        values={{ br: () => <br /> }}
                    />
                }
                device={device}
                isConfirmedOnDevice
                isActionAbortable
            />
        );
    }

    if (isNfcBackup && device) {
        return (
            <>
                <CreateNfcBackup onBack={() => goToPreviousStep()} onCreateBackup={handleStart} />
                <ConfirmActionModal device={device} enableBackdropClick={false} />
            </>
        );
    }

    return (
        <OnboardingCard
            iconName="trezorBackup"
            heading={<Translation id="TR_CREATE_BACKUP" />}
            description={<Translation id="TR_ONBOARDING_TREZOR_WILL_DISPLAY_BACKUP" />}
            device={device}
            isConfirmedOnDevice
            isActionAbortable
        />
    );
};
