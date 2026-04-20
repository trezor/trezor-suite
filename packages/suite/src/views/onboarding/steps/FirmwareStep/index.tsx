import { useCallback } from 'react';

import {
    Fingerprint,
    FirmwareInstallationProgressCheck,
    getSuiteFirmwareTypeString,
    useFirmwareDesktopUpdate,
    useFirmwareInstallationProgressCheck,
} from '@suite/firmware';
import { Translation } from '@suite/intl';
import { MODAL_CONTEXT_DEVICE } from '@suite/modal';
import { OnboardingCard } from '@suite/onboarding-components';
import { selectSelectedDevice } from '@suite-common/device';
import { Card } from '@trezor/components';
import { getFirmwareVersion } from '@trezor/device-utils';
import { exhaustive } from '@trezor/type-utils';

import { ThpPairingStep } from 'src/components/onboarding/ThpPairingStep/ThpPairingStep';
import { useOnboarding, useSelector } from 'src/hooks/suite';

import { FirmwareInitialStep } from './FirmwareInitialStep';
import { FirmwareInstallationStep } from './FirmwareInstallationStep';
import { DeviceDisconnectedStep } from '../../UnexpectedState/DeviceDisconnectedStep';

export const FirmwareStep = () => {
    const device = useSelector(selectSelectedDevice);
    const modal = useSelector(state => state.modal);
    const { goToNextStep, updateAnalytics } = useOnboarding();
    const { error, resetReducer, firmwareUpdate, targetType, status } = useFirmwareDesktopUpdate();
    const { isProgressCheckDisplayed, handleDismissProgressCheck } =
        useFirmwareInstallationProgressCheck();

    const install = () => firmwareUpdate({ firmwareType: targetType });
    const goToNextStepAndResetReducer = useCallback(() => {
        goToNextStep();
        resetReducer();
    }, [goToNextStep, resetReducer]);

    const showFingerprintCheck =
        modal.context === MODAL_CONTEXT_DEVICE &&
        modal.windowType === 'ButtonRequest_FirmwareCheck';

    if (showFingerprintCheck && device) {
        // Some old firmwares ask for verifying firmware fingerprint by dispatching ButtonRequest_FirmwareCheck
        return (
            <OnboardingCard
                iconName="circuitry"
                heading={<Translation id="TR_CHECK_FINGERPRINT" />}
                device={device}
                isActionAbortable={false}
                isConfirmedOnDevice
            >
                <Fingerprint device={device} />
            </OnboardingCard>
        );
    }

    // edge case 1 - Installation failed
    if (status === 'error') {
        return (
            <OnboardingCard
                iconName="circuitry"
                heading={<Translation id="TR_FW_INSTALLATION_FAILED" />}
                description={<Translation id="TOAST_GENERIC_ERROR" values={{ error }} />}
                innerActions={
                    <OnboardingCard.Button onClick={install} data-testid="@firmware/retry-button">
                        <Translation id="TR_RETRY" />
                    </OnboardingCard.Button>
                }
                outerActions={
                    <OnboardingCard.SecondaryButton onClick={() => resetReducer()}>
                        <Translation id="TR_BACK" />
                    </OnboardingCard.SecondaryButton>
                }
            />
        );
    }

    // edge case 2 - user has reconnected device that is already up to date
    // exclude "started" status to prevent displaying this during installation
    // exclude "pairing" status to prevent displaying this during pairing
    // include "custom" firmware to get past this step when testing firmware for new device types etc.
    if (
        !['started', 'thp-pairing', 'done'].includes(status) &&
        device?.firmware &&
        ['custom', 'valid'].includes(device.firmware)
    ) {
        const firmwareType = getSuiteFirmwareTypeString(device.firmwareType);

        return (
            <OnboardingCard
                iconName="circuitry"
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
                    <OnboardingCard.Button
                        data-testid="@firmware/continue-button"
                        onClick={() => {
                            goToNextStep();
                            updateAnalytics({ firmware: 'up-to-date' });
                        }}
                    >
                        <Translation id="TR_CONTINUE" />
                    </OnboardingCard.Button>
                }
            />
        );
    }

    if (['initial', 'done'].includes(status) && (!device?.connected || !device?.features)) {
        // Most users won't see this as they should come here with a connected device.
        // This is just for people who want to shoot themselves in the foot and disconnect the device before proceeding with fw update flow
        return <DeviceDisconnectedStep />;
    }

    switch (status) {
        // check-seed is omitted as it is only relevant in separate fw update flow and it is not used in onboarding since user don't have any seed at that time
        case 'initial':
            return <FirmwareInitialStep />;
        case 'started': // called from firmwareUpdate()
        case 'done': // This is shown only for NON-THP devices, THP device goes directly to the next step after successful THP pairing. see onboardingMiddleware
            if (isProgressCheckDisplayed) {
                return (
                    <Card paddingType="large">
                        <FirmwareInstallationProgressCheck
                            handleDismiss={handleDismissProgressCheck}
                        />
                    </Card>
                );
            }

            return (
                <FirmwareInstallationStep
                    install={install}
                    onSuccess={goToNextStepAndResetReducer}
                />
            );
        case 'thp-pairing': {
            return <ThpPairingStep />;
        }

        // This step does not make sense in onboarding; when installing firmware
        // for the first time, there is no seed to be backed up before the firmware update.
        case 'check-seed':
            return null;

        default:
            return exhaustive(status);
    }
};
