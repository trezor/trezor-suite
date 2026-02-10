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
import { useDevice, useDispatch, useOnboarding, useSelector } from 'src/hooks/suite';

type SecurityStepStatus = 'initial' | 'in-progress' | 'finished';

export const SecurityStep = () => {
    const [status, setStatus] = useState<SecurityStepStatus>('initial');
    const { goToNextStep, goToPreviousStep, updateAnalytics, backupType } = useOnboarding();
    const { isLocked } = useDevice();
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();
    const backup = useSelector(state => state.backup);
    const isDeviceLocked = isLocked();
    const isBackupRequired = useSelector(selectIsDeviceBackupRequired);

    const getResetDeviceParams = useCallback(() => {
        // All types use skip_backup: false — wallet creation + backup is atomic,
        // matching native device onboarding. If backup fails, device wipes itself.
        switch (backupType) {
            case 'shamir-single':
                // Slip39_Single_Extendable — firmware handles single-share Shamir natively,
                // shows "20 words" without asking for shares/threshold.
                return { backup_type: 3 as const, skip_backup: false };
            case 'shamir-advanced':
                return { backup_type: 1 as const, skip_backup: false };
            case '12-words':
                return { backup_type: 0 as const, strength: 128, skip_backup: false };
            case '24-words':
                return { backup_type: 0 as const, strength: 256, skip_backup: false };
            default:
                return exhaustive(backupType);
        }
    }, [backupType]);

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

    if (status === 'initial') {
        return (
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
                    <OnboardingCard.SecondaryButton onClick={() => goToPreviousStep()}>
                        <Translation id="TR_BACK" />
                    </OnboardingCard.SecondaryButton>
                }
            >
                <BackupSeedCards />
            </OnboardingCard>
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
