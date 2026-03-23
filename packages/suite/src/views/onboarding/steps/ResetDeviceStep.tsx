import { useCallback, useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { selectDeviceDefaultBackupType, selectSelectedDevice } from '@suite-common/device';
import { type BackupType } from '@suite-common/suite-types';
import { Text } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';

import { resetDevice } from 'src/actions/settings/deviceSettingsActions';
import * as STEP from 'src/constants/onboarding/steps';
import { useDevice, useDispatch, useOnboarding, useSelector } from 'src/hooks/suite';

import { SelectBackupType } from './SelectBackupType/SelectBackupType';
import { isShamirBackupType } from './utils';

const canChooseBackupType = (device: DeviceModelInternal) => device !== DeviceModelInternal.T1B1;

export const ResetDeviceStep = () => {
    const { isLocked } = useDevice();
    const device = useSelector(selectSelectedDevice);
    const deviceDefaultBackupType = useSelector(selectDeviceDefaultBackupType);

    const deviceModel = device?.features?.internal_model;
    const unitPackaging = device?.features?.unit_packaging ?? 0;

    const [submitted, setSubmitted] = useState(false);
    const [backupType, setBackupType] = useState<BackupType>(deviceDefaultBackupType);
    const { goToPreviousStep, goToNextStep, updateAnalytics, updateBackupType } = useOnboarding();

    const dispatch = useDispatch();

    const isWaitingForConfirmation =
        device?.buttonRequests.some(
            r => r.code === 'ButtonRequest_ResetDevice' || r.code === 'ButtonRequest_ProtectCall',
        ) && !submitted; // ButtonRequest_ResetDevice is for T2T1, ButtonRequest_ProtectCall for T1B1

    const isDeviceLocked = isLocked();

    const onResetDevice = useCallback(
        async (params?: Parameters<typeof resetDevice>[0]) => {
            setSubmitted(false);

            const result = await dispatch(resetDevice(params));

            setSubmitted(true);

            if (result?.success) {
                goToNextStep(STEP.ID_SECURITY_STEP);
            }
        },
        [dispatch, goToNextStep],
    );

    const handleSubmit = useCallback(
        async (type: BackupType) => {
            switch (type) {
                case 'shamir-single':
                    // We do not send `_Extendable` versions of the `backup_type` to be compatible
                    // with older firmwares. New firmware creates always extensible Shamir. Even for
                    // original, non-extendable enum values.
                    await onResetDevice({ backup_type: 1 });
                    break;
                case 'shamir-advanced': // <-- bad naming, this means `multi-share`
                    // This is for multi-share, but we send simple Slip39_Basic. At this point,
                    // the device does not care about extendibility, the only info needed is that its Shamir
                    // and extendability are handled in the `TrezorConnect.backupDevice(...)
                    await onResetDevice({ backup_type: 1 });
                    break;
                case '12-words':
                    await onResetDevice({ backup_type: 0, strength: 128 });
                    break;
                case '24-words':
                    await onResetDevice({ backup_type: 0, strength: 256 });
                    break;
            }

            updateBackupType(type);
            updateAnalytics({ seedType: type });
        },
        [updateBackupType, updateAnalytics, onResetDevice],
    );

    useEffect(() => {
        if (deviceModel !== undefined && !canChooseBackupType(deviceModel)) {
            handleSubmit(deviceDefaultBackupType);
        }
    }, [deviceModel, handleSubmit, unitPackaging, deviceDefaultBackupType]);

    // this step expects device
    if (!device || !device.features) {
        return null;
    }

    const isWaitingOnDevice = isWaitingForConfirmation || isDeviceLocked;
    const canChoseBackupType = deviceModel !== undefined && canChooseBackupType(deviceModel);

    const getChooseBackupTranslationId = () => {
        if (isWaitingOnDevice) {
            return 'TR_ONBOARDING_WILL_CREATE_BACKUP_TYPE';
        }

        return isShamirBackupType(deviceDefaultBackupType)
            ? 'TR_ONBOARDING_SELECTED_OPTIMAL_BACKUP_TYPE'
            : 'TR_ONBOARDING_SELECTED_DEFAULT_BACKUP_TYPE';
    };

    return (
        <OnboardingCard
            iconName="wallet"
            heading={<Translation id="TR_ONBOARDING_CREATE_NEW_WALLET" />}
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
            isActionAbortable={true}
            isConfirmedOnDevice={isWaitingForConfirmation}
            innerActions={
                !isWaitingOnDevice && (
                    <OnboardingCard.Button
                        isDisabled={isDeviceLocked}
                        onClick={() => handleSubmit(backupType)}
                        data-testid="@onboarding/select-seed-type-confirm"
                    >
                        <Translation id="TR_ONBOARDING_SELECT_SEED_TYPE_CONFIRM" />
                    </OnboardingCard.Button>
                )
            }
            outerActions={
                !isWaitingOnDevice && (
                    // There is no point to show back button if user can't click it because confirmOnDevice bubble is active
                    <OnboardingCard.SecondaryButton onClick={() => goToPreviousStep()}>
                        <Translation id="TR_BACK" />
                    </OnboardingCard.SecondaryButton>
                )
            }
        >
            {!isWaitingOnDevice && canChoseBackupType && (
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
