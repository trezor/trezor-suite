import { useState } from 'react';

import {
    type BackupDeviceParams,
    backupDeviceThunk,
    canContinue,
    selectBackup,
    selectBackupStatus,
} from '@suite/backup';
import { Translation } from '@suite/intl';
import { selectIsDeviceLocked } from '@suite/locks';
import { SettingsAnchor, goto } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { exhaustive } from '@trezor/type-utils';

import { goToNextStep, updateAnalytics } from 'src/actions/onboarding/onboardingActions';
import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import { BackupSeedCards } from 'src/components/backup';
import { OnboardingCard } from 'src/components/onboarding/OnboardingCard/OnboardingCard';
import { SkipStepConfirmation } from 'src/components/onboarding/SkipStepConfirmation';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const BackupStep = () => {
    const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
    const backup = useSelector(selectBackup);
    const backupStatus = useSelector(selectBackupStatus);
    const device = useSelector(selectSelectedDevice);
    const isDeviceLocked = useSelector(selectIsDeviceLocked);
    const dispatch = useDispatch();

    const { backupType } = useSelector(state => state.onboarding);

    const handleBackup = () => {
        dispatch(updateAnalytics({ backup: 'create' }));

        const params: BackupDeviceParams =
            backupType === 'shamir-single'
                ? {
                      group_threshold: 1,
                      groups: [{ member_count: 1, member_threshold: 1 }],
                  }
                : {};

        dispatch(backupDeviceThunk({ params, skipSuccessToast: true }));
    };

    const handleSkip = () => {
        dispatch(updateAnalytics({ backup: 'skip' }));
        setShowSkipConfirmation(true);
    };

    const handleResetOnboarding = () => {
        dispatch(onboardingActions.resetOnboarding());
        dispatch(goto({ routeName: 'settings-device', anchor: SettingsAnchor.WipeDevice }));
    };

    const getContent = () => {
        switch (backupStatus) {
            case 'initial':
                return (
                    <OnboardingCard
                        iconName="trezorBackup"
                        heading={<Translation id="TR_CREATE_BACKUP" />}
                        description={<Translation id="TR_ONBOARDING_BACKUP_SUBHEADING" />}
                        innerActions={
                            <OnboardingCard.Button
                                data-testid="@backup/start-button"
                                onClick={handleBackup}
                                isDisabled={!canContinue(backup.userConfirmed, isDeviceLocked)}
                            >
                                <Translation id="TR_START_BACKUP" />
                            </OnboardingCard.Button>
                        }
                        outerActions={
                            <OnboardingCard.SecondaryButton
                                data-testid="@onboarding/skip-backup"
                                onClick={handleSkip}
                            >
                                <Translation id="TR_SKIP_BACKUP" />
                            </OnboardingCard.SecondaryButton>
                        }
                    >
                        <BackupSeedCards />
                    </OnboardingCard>
                );
            case 'in-progress':
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
            case 'finished':
                return (
                    <OnboardingCard
                        iconName="check"
                        heading={<Translation id="TR_BACKUP_CREATED" />}
                        description={<Translation id="TR_BACKUP_FINISHED_TEXT" />}
                        innerActions={
                            <OnboardingCard.Button
                                data-testid="@backup/close-button"
                                onClick={() => dispatch(goToNextStep())}
                                isDisabled={!canContinue(backup.userConfirmed)}
                            >
                                <Translation id="TR_BACKUP_FINISHED_BUTTON" />
                            </OnboardingCard.Button>
                        }
                    />
                );
            case 'error':
                return (
                    <OnboardingCard
                        iconName="trezorBackup"
                        heading={<Translation id="TOAST_BACKUP_FAILED" />}
                        description={
                            <Translation id="TR_DEVICE_DISCONNECTED_DURING_ACTION_DESCRIPTION" />
                        }
                        variant="destructive"
                        innerActions={
                            <OnboardingCard.Button
                                intent="critical"
                                onClick={handleResetOnboarding}
                            >
                                <Translation id="TR_GO_TO_SETTINGS" />
                            </OnboardingCard.Button>
                        }
                    />
                );
            default:
                return exhaustive(backupStatus);
        }
    };

    return (
        <>
            {showSkipConfirmation && (
                <SkipStepConfirmation onCancel={() => setShowSkipConfirmation(false)} />
            )}
            {getContent()}
        </>
    );
};
