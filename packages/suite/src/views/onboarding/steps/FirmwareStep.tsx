import { useCallback, useEffect } from 'react';

import { useFirmwareInstallation } from '@suite-common/firmware';
import { selectThpStep } from '@suite-common/thp';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { getFirmwareVersion } from '@trezor/device-utils';
import { exhaustive } from '@trezor/type-utils';

import { MODAL } from 'src/actions/suite/constants';
import {
    Fingerprint,
    FirmwareContinueButton,
    FirmwareInitial,
    FirmwareRetryButton,
} from 'src/components/firmware';
import { OnboardingButtonBack, OnboardingStepBox } from 'src/components/onboarding';
import { PrerequisitesGuide, Translation } from 'src/components/suite';
import { useOnboarding, useSelector } from 'src/hooks/suite';
import { getSuiteFirmwareTypeString } from 'src/utils/firmware';

import { FirmwareInstallation } from './FirmwareInstallation';
import { ThpPairingConfirmStep } from './ThpPairingConfirmStep';
import { ThpPairingFailedStep } from './ThpPairingFailedStep';
import { ThpPairingStartStep } from './ThpPairingStartStep';
import { ThpPairingStep } from './ThpPairingStep';

export const FirmwareStep = () => {
    const device = useSelector(selectSelectedDevice);
    const modal = useSelector(state => state.modal);
    const { goToNextStep, updateAnalytics } = useOnboarding();
    const { status, error, resetReducer, firmwareUpdate, targetType } = useFirmwareInstallation();
    const thpStep = useSelector(selectThpStep);

    const install = () => firmwareUpdate({ firmwareType: targetType });
    const goToNextStepAndResetReducer = useCallback(() => {
        goToNextStep();
        resetReducer();
    }, [goToNextStep, resetReducer]);

    // After the THP is finished, we want to jump to the next step automatically.
    // For devices without THP, the user is supposed to click [Continue] after
    // the installation is finished. For THP devices, however, user already drifted
    // away from the installation flow, and is not aware that THP is actually in the middle
    // of the Firmware installation (before the final version checks). So we need to jump
    // automagically to the next step in onboarding.
    //
    // This is an ugly hack to do so using the effect.
    useEffect(() => {
        if (status === 'done' && device?.thp?.properties !== undefined) {
            goToNextStepAndResetReducer();
        }
    }, [status, goToNextStepAndResetReducer, device]);

    const showFingerprintCheck =
        modal.context === MODAL.CONTEXT_DEVICE &&
        modal.windowType === 'ButtonRequest_FirmwareCheck';

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

    if (thpStep !== null) {
        if (device === undefined) {
            return null;
        }

        switch (thpStep) {
            case 'BeforeConnectionInfo':
                return <ThpPairingStartStep />;
            case 'ConfirmOnlyConnection':
            case 'ConfirmConnectionBeforePairing':
                return <ThpPairingConfirmStep device={device} />;
            case 'CodeEntry':
                return <ThpPairingStep />;

            // Auto-connect not relevant for Onboarding Firmware Installation.
            // 1) We don't want to ask user for autoconnect during FW installation.
            // 2) It shall never happen anyway, onboarding is the 1st connection.
            case 'AutoconnectInfo':
            case 'Autoconnect':
                return null;

            case 'CodeInvalid':
                return <ThpPairingFailedStep />;

            default:
                exhaustive(thpStep);
        }
    }

    switch (status) {
        // check-seed is omitted as it is only relevant in separate fw update flow and it is not used in onboarding since user don't have any seed at that time
        case 'initial':
            return <FirmwareInitial />;
        case 'started': // called from firmwareUpdate()
        case 'done': // This is shown only for NON-THP devices, THP device goes directly to the next step after successful THP pairing
            return (
                <FirmwareInstallation install={install} onSuccess={goToNextStepAndResetReducer} />
            );

        // This step does not make sense in onboarding; when installing firmware
        // for the first time, there is no seed to be backed up before the firmware update.
        case 'check-seed':
            return null;

        default:
            return exhaustive(status);
    }
};
