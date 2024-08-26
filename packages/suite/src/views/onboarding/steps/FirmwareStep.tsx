import { getFirmwareVersion } from '@trezor/device-utils';
import { selectDevice } from '@suite-common/wallet-core';

import { OnboardingButtonBack, OnboardingStepBox } from 'src/components/onboarding';
import { PrerequisitesGuide, Translation } from 'src/components/suite';
import {
    FirmwareContinueButton,
    FirmwareRetryButton,
    FirmwareInstallation,
    FirmwareInitial,
    Fingerprint,
} from 'src/components/firmware';
import { useSelector, useFirmware, useOnboarding } from 'src/hooks/suite';
import { getSuiteFirmwareTypeString } from 'src/utils/firmware';

export const FirmwareStep = () => {
    const device = useSelector(selectDevice);
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

    const install = () => firmwareUpdate({ firmwareType: targetType });
    const goToNextStepAndResetReducer = () => {
        goToNextStep();
        resetReducer();
    };

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
                device={device}
                isActionAbortable={false}
            >
                <Fingerprint device={device} />
            </OnboardingStepBox>
        );
    }

    // edge case 1 - Installation failed
    if (status === 'error') {
        return (
            <OnboardingStepBox
                image="FIRMWARE"
                heading={<Translation id="TR_FW_INSTALLATION_FAILED" />}
                description={<Translation id="TOAST_GENERIC_ERROR" values={{ error }} />}
                innerActions={<FirmwareRetryButton onClick={install} />}
                outerActions={<OnboardingButtonBack onClick={() => resetReducer()} />}
            />
        );
    }

    // edge case 2 - user has reconnected device that is already up to date
    // include "started" status to prevent displaying this during installation
    // include "custom" firmware to get past this step when testing firmware for new device types etc.
    if (
        !['started', 'done'].includes(status) &&
        device?.firmware &&
        ['custom', 'valid'].includes(device.firmware)
    ) {
        const firmwareType = getSuiteFirmwareTypeString(device.firmwareType);

        return (
            <OnboardingStepBox
                image="FIRMWARE"
                heading={<Translation id="TR_FIRMWARE_IS_UP_TO_DATE" />}
                description={
                    <Translation
                        id="TR_FIRMWARE_INSTALLED_TEXT"
                        values={{
                            type: firmwareType ? (
                                <>
                                    <Translation id={firmwareType} />
                                    &nbsp;
                                </>
                            ) : (
                                ''
                            ),
                            version: getFirmwareVersion(device),
                        }}
                    />
                }
                innerActions={
                    <FirmwareContinueButton
                        onClick={() => {
                            goToNextStep();
                            updateAnalytics({ firmware: 'up-to-date' });
                        }}
                    />
                }
            />
        );
    }

    if (['initial', 'done'].includes(status) && (!device?.connected || !device?.features)) {
        // Most users won't see this as they should come here with a connected device.
        // This is just for people who want to shoot themselves in the foot and disconnect the device before proceeding with fw update flow
        return <PrerequisitesGuide />;
    }

    switch (status) {
        // check-seed is omitted as it is only relevant in separate fw update flow and it is not used in onboarding since user don't have any seed at that time
        case 'initial':
            return <FirmwareInitial />;
        case 'started': // called from firmwareUpdate()
        case 'done':
            return (
                <FirmwareInstallation install={install} onSuccess={goToNextStepAndResetReducer} />
            );
        default:
            // 'ensure' type completeness
            throw new Error(`state "${status}" is not handled here`);
    }
};
