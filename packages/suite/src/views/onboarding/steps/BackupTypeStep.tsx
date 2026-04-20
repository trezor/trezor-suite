import { useCallback, useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import { SelectBackupType as SelectBackupMedium } from '@suite/nfc';
import { OnboardingCard } from '@suite/onboarding-components';
import { selectIsN4w1BackupEnabled } from '@suite/settings';
import { selectDeviceDefaultBackupType, selectSelectedDevice } from '@suite-common/device';
import { type BackupType } from '@suite-common/suite-types';
import { Badge, Column, Text } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';

import { useDevice, useOnboarding, useSelector } from 'src/hooks/suite';

import { SelectBackupType } from './SelectBackupType/SelectBackupType';
import { isShamirBackupType } from './utils';

const canChooseBackupType = (device: DeviceModelInternal) => device !== DeviceModelInternal.T1B1;

export const BackupTypeStep = () => {
    const { isLocked } = useDevice();
    const device = useSelector(selectSelectedDevice);
    const deviceDefaultBackupType = useSelector(selectDeviceDefaultBackupType);
    const isN4w1BackupEnabled = useSelector(selectIsN4w1BackupEnabled);

    const deviceModel = device?.features?.internal_model;
    const unitPackaging = device?.features?.unit_packaging ?? 0;

    const [backupType, setBackupType] = useState<BackupType>(deviceDefaultBackupType);
    const [showMediumChoice, setShowMediumChoice] = useState(isN4w1BackupEnabled);
    const { goToPreviousStep, goToNextStep, updateAnalytics, updateBackupType } = useOnboarding();

    const isDeviceLocked = isLocked();

    // Only saves the selected backup type and navigates to the security step.
    // The actual resetDevice call (with skip_backup: false) happens in SecurityStep,
    // where the backup guide is shown before wallet creation + backup.
    const handleSubmit = useCallback(
        (type: BackupType) => {
            updateBackupType(type);
            updateAnalytics({ seedType: type });
            goToNextStep();
        },
        [updateBackupType, updateAnalytics, goToNextStep],
    );

    useEffect(() => {
        if (deviceModel !== undefined && !canChooseBackupType(deviceModel)) {
            handleSubmit(deviceDefaultBackupType);
        }
    }, [deviceModel, handleSubmit, unitPackaging, deviceDefaultBackupType]);

    if (!device || !device.features) {
        return null;
    }

    if (showMediumChoice) {
        return (
            <SelectBackupMedium
                onBack={() => goToPreviousStep()}
                onContinueWithNfc={() => goToNextStep()}
                onContinueWithoutNfc={() => setShowMediumChoice(false)}
            />
        );
    }

    const canChoseBackupType = deviceModel !== undefined && canChooseBackupType(deviceModel);

    const getChooseBackupTranslationId = () =>
        isShamirBackupType(deviceDefaultBackupType)
            ? 'TR_ONBOARDING_SELECTED_OPTIMAL_BACKUP_TYPE'
            : 'TR_ONBOARDING_SELECTED_DEFAULT_BACKUP_TYPE';

    return (
        <OnboardingCard
            iconName="wallet"
            heading={
                <Column gap={8} alignItems="center" justifyContent="center">
                    <Badge intent="neutral" size="medium">
                        <Translation id="TR_NEW_WALLET" />
                    </Badge>
                    <Translation id="TR_WALLET_BACKUP_TYPE" />
                </Column>
            }
            description={
                canChoseBackupType ? (
                    <Translation
                        id={getChooseBackupTranslationId()}
                        values={{
                            primary: chunks => <Text intent="brand">{chunks}</Text>,
                            br: () => <br />,
                        }}
                    />
                ) : (
                    <Translation id="TR_ONBOARDING_CANNOT_SELECT_SEED_TYPE" />
                )
            }
            device={device}
            innerActions={
                <OnboardingCard.Button
                    isDisabled={isDeviceLocked}
                    onClick={() => handleSubmit(backupType)}
                    data-testid="@onboarding/select-seed-type-confirm"
                >
                    <Translation id="TR_ONBOARDING_SELECT_SEED_TYPE_CONTINUE" />
                </OnboardingCard.Button>
            }
            outerActions={
                <OnboardingCard.SecondaryButton
                    onClick={() =>
                        isN4w1BackupEnabled ? setShowMediumChoice(true) : goToPreviousStep()
                    }
                >
                    <Translation id="TR_BACK" />
                </OnboardingCard.SecondaryButton>
            }
        >
            {canChoseBackupType && (
                <SelectBackupType
                    selected={backupType}
                    onOpen={() => updateAnalytics({ wasSelectTypeOpened: true })}
                    onSelect={setBackupType}
                    isDisabled={isDeviceLocked}
                    data-testid="@onboarding/select-seed-type-open-dialog"
                />
            )}
        </OnboardingCard>
    );
};
