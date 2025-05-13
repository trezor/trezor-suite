import { useCallback, useEffect, useState } from 'react';

import styled from 'styled-components';

import { BackupType } from '@suite-common/suite-types';
import { selectDeviceDefaultBackupType, selectSelectedDevice } from '@suite-common/wallet-core';
import { Button, Divider, Text, Tooltip } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';

import { resetDevice } from 'src/actions/settings/deviceSettingsActions';
import { OnboardingButtonBack, OnboardingStepBox, OptionsWrapper } from 'src/components/onboarding';
import { Translation } from 'src/components/suite';
import * as STEP from 'src/constants/onboarding/steps';
import { useDevice, useDispatch, useOnboarding, useSelector } from 'src/hooks/suite';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';

import { SelectBackupType, isShamirBackupType } from './SelectBackupType/SelectBackupType';

const SelectWrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
`;

const ButtonWrapper = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
`;

const canChooseBackupType = (device: DeviceModelInternal) => device !== DeviceModelInternal.T1B1;

export const ResetDeviceStep = () => {
    const { isLocked } = useDevice();
    const device = useSelector(selectSelectedDevice);
    const deviceDefaultBackupType = useSelector(selectDeviceDefaultBackupType);
    const isActionAbortable = useSelector(selectIsActionAbortable);

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
                    await onResetDevice({ backup_type: 1 });
                    break;
                case 'shamir-advanced':
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
        <OnboardingStepBox
            image="KEY"
            heading={<Translation id="TR_ONBOARDING_CREATE_NEW_WALLET" />}
            description={
                canChoseBackupType ? (
                    <Translation
                        id={getChooseBackupTranslationId()}
                        values={{
                            primary: chunks => <Text variant="secondary">{chunks}</Text>,
                            br: () => <br />,
                        }}
                    />
                ) : (
                    <Translation id="TR_ONBOARDING_CANNOT_SELECT_SEED_TYPE" />
                )
            }
            device={isWaitingForConfirmation ? device : undefined}
            isActionAbortable={isActionAbortable}
            outerActions={
                isWaitingOnDevice && (
                    // There is no point to show back button if user can't click it because confirmOnDevice bubble is active
                    <OnboardingButtonBack onClick={() => goToPreviousStep()} />
                )
            }
        >
            {!isWaitingOnDevice ? (
                <OptionsWrapper $fullWidth={true}>
                    <SelectWrapper>
                        {canChoseBackupType && (
                            <>
                                <Tooltip
                                    isActive={isDeviceLocked}
                                    content={
                                        <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                                    }
                                >
                                    <SelectBackupType
                                        selected={backupType}
                                        onOpen={() =>
                                            updateAnalytics({ wasSelectTypeOpened: true })
                                        }
                                        onSelect={setBackupType}
                                        isDisabled={isDeviceLocked}
                                        data-testid="@onboarding/select-seed-type-open-dialog"
                                    />
                                </Tooltip>
                                <Divider />
                            </>
                        )}
                        <ButtonWrapper>
                            <Tooltip
                                isActive={isDeviceLocked}
                                content={
                                    <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                                }
                            >
                                <Button
                                    variant="primary"
                                    isDisabled={isDeviceLocked}
                                    onClick={() => handleSubmit(backupType)}
                                    data-testid="@onboarding/select-seed-type-confirm"
                                >
                                    <Translation id="TR_ONBOARDING_SELECT_SEED_TYPE_CONFIRM" />
                                </Button>
                            </Tooltip>
                        </ButtonWrapper>
                    </SelectWrapper>
                </OptionsWrapper>
            ) : undefined}
        </OnboardingStepBox>
    );
};
