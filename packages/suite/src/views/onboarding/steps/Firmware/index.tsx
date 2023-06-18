import React, { useState } from 'react';
import { OnboardingButtonBack, OnboardingStepBox } from 'src/components/onboarding';
import { Translation } from 'src/components/suite';
import {
    ContinueButton,
    RetryButton,
    FirmwareInstallation,
    FirmwareInitial,
    Fingerprint,
} from 'src/components/firmware';
import { useSelector, useFirmware, useOnboarding } from 'src/hooks/suite';
import { TrezorDevice } from 'src/types/suite';
import { getFirmwareType, getFirmwareVersion, getDeviceModel } from '@trezor/device-utils';

const FirmwareStep = () => {
    const { device } = useSelector(state => ({
        device: state.suite.device,
    }));
    const { goToNextStep, updateAnalytics } = useOnboarding();
    const {
        status,
        error,
        resetReducer,
        firmwareUpdate,
        showFingerprintCheck,
        firmwareHashInvalid,
        targetType,
    } = useFirmware();
    const [cachedDevice, setCachedDevice] = useState<TrezorDevice | undefined>(device);
    const deviceModel = getDeviceModel(device);

    // special and hopefully very rare case. this appears when somebody tried to fool user into using a hacked firmware
    if (device?.id && firmwareHashInvalid.includes(device.id)) {
        return (
            <OnboardingStepBox
                image="UNI_ERROR"
                heading={<Translation id="TR_FIRMWARE_HASH_MISMATCH" />}
            />
        );
    }

    if (showFingerprintCheck && device) {
        // Some old firmwares ask for verifying firmware fingerprint by dispatching ButtonRequest_FirmwareCheck
        return (
            <OnboardingStepBox
                image="FIRMWARE"
                heading={<Translation id="TR_CHECK_FINGERPRINT" />}
                deviceModel={deviceModel}
                isActionAbortable={false}
            >
                <Fingerprint device={device} />
            </OnboardingStepBox>
        );
    }

    // edge case 1 - Installation failed
    if (error) {
        return (
            <OnboardingStepBox
                image="FIRMWARE"
                heading={<Translation id="TR_FW_INSTALLATION_FAILED" />}
                description={<Translation id="TOAST_GENERIC_ERROR" values={{ error }} />}
                innerActions={<RetryButton onClick={() => firmwareUpdate(targetType)} />}
                outerActions={
                    <OnboardingButtonBack onClick={() => resetReducer()}>
                        <Translation id="TR_BACK" />
                    </OnboardingButtonBack>
                }
            />
        );
    }

    // edge case 2 - user has reconnected device that is already up to date
    // include "validation" status to prevent displaying this during installation
    if (!['validation', 'done'].includes(status) && device?.firmware === 'valid') {
        return (
            <OnboardingStepBox
                image="FIRMWARE"
                heading={<Translation id="TR_FIRMWARE_IS_UP_TO_DATE" />}
                description={
                    <Translation
                        id="TR_FIRMWARE_INSTALLED_TEXT"
                        values={{
                            type: getFirmwareType(device),
                            version: getFirmwareVersion(device),
                        }}
                    />
                }
                innerActions={
                    <ContinueButton
                        onClick={() => {
                            goToNextStep();
                            updateAnalytics({ firmware: 'up-to-date' });
                        }}
                    />
                }
            />
        );
    }

    switch (status) {
        // check-seed is omitted as it is only relevant in separate fw update flow and it is not used in onboarding since user don't have any seed at that time
        case 'initial':
        case 'waiting-for-bootloader': // waiting for user to reconnect in bootloader
            return (
                <FirmwareInitial
                    cachedDevice={cachedDevice}
                    setCachedDevice={setCachedDevice}
                    onInstall={firmwareUpdate}
                />
            );
        case 'waiting-for-confirmation': // waiting for confirming installation on a device
        case 'started': // called from firmwareUpdate()
        case 'installing':
        case 'wait-for-reboot':
        case 'validation':
        case 'unplug': // only relevant for T1, TT auto restarts itself
        case 'reconnect-in-normal': // only relevant for T1, TT auto restarts itself
        case 'partially-done': // only relevant for T1, updating from very old fw is done in 2 fw updates, partially-done means first update was installed
        case 'done':
            return <FirmwareInstallation cachedDevice={cachedDevice} onSuccess={goToNextStep} />;
        default:
            // 'ensure' type completeness
            throw new Error(`state "${status}" is not handled here`);
    }
};

export default FirmwareStep;
