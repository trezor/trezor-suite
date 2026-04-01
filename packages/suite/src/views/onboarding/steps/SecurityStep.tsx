import { useCallback, useState } from 'react';

import { canContinue } from '@suite/backup';
import { Translation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { goto } from '@suite/router';
import { selectIsDeviceBackupRequired, selectSelectedDevice } from '@suite-common/device';
import { Badge, Column } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { resetDevice } from 'src/actions/settings/deviceSettingsActions';
import { BackupSeedCards } from 'src/components/backup';
import { SkipStepConfirmation } from 'src/components/onboarding/SkipStepConfirmation';
import { useDevice, useDispatch, useOnboarding, useSelector } from 'src/hooks/suite';

type SecurityStepStatus = 'initial' | 'in-progress' | 'skipping-backup' | 'finished';

export const SecurityStep = () => {
    const [status, setStatus] = useState<SecurityStepStatus>('initial');
    const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
    const { goToNextStep, updateAnalytics, backupType } = useOnboarding();
    const { isLocked } = useDevice();
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();
    const backup = useSelector(state => state.backup);
    const isDeviceLocked = isLocked();
    const isBackupRequired = useSelector(selectIsDeviceBackupRequired);

    const getResetDeviceParams = useCallback(
        (skipBackup: boolean = false) => {
            // All types use skip_backup: false — wallet creation + backup is atomic,
            // matching native device onboarding. If backup fails, device wipes itself.
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
        },
        [backupType],
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
            dispatch(goto({ routeName: 'suite-index' }));
        }
    }, [dispatch, getResetDeviceParams, updateAnalytics]);

    const handleSkipBackup = useCallback(async () => {
        updateAnalytics({ backup: 'skip' });
        setShowSkipConfirmation(false);
        setStatus('skipping-backup');
        const result = await dispatch(resetDevice(getResetDeviceParams(true)));
        if (result?.success) {
            goToNextStep('set-pin');
        } else {
            dispatch(goto({ routeName: 'suite-index' }));
        }
    }, [dispatch, getResetDeviceParams, goToNextStep, updateAnalytics]);

    if (status === 'initial') {
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
