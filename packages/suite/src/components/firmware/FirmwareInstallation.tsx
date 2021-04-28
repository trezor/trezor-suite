import React from 'react';
import { Button } from '@trezor/components';
import { getTextForStatus } from '@firmware-utils';
import { Translation, WebusbButton } from '@suite-components';
import { useDevice, useFirmware, useOnboarding } from '@suite-hooks';
import { FirmwareOffer, ReconnectDevicePrompt, OnboardingStepBox } from '@firmware-components';
import { getFwUpdateVersion, getFwVersion } from '@suite-utils/device';
import { AcquiredDevice } from '@suite-types';
import ProgressBar from './ProgressBar';

interface Props {
    cachedDevice: AcquiredDevice;
}
const FirmwareInstallation = ({ cachedDevice }: Props) => {
    const { device } = useDevice();
    const {
        status,
        installingProgress,
        resetReducer,
        isWebUSB,
        subsequentInstalling,
    } = useFirmware();
    const { goToNextStep } = useOnboarding();
    const statusIntlId = getTextForStatus(status);
    const statusText = statusIntlId ? <Translation id={statusIntlId} /> : null;

    const getFakeProgressDuration = () => {
        if (cachedDevice.firmware === 'none') {
            // device without fw starts installation without a confirmation and we need to fake progress bar for both devices (UI.FIRMWARE_PROGRESS is sent too late)
            return cachedDevice.features.major_version === 1 ? 25 : 40; // T1 seems a bit faster
        }
        // Updating from older fw, device asks for confirmation, but sends first info about installation progress somewhat to late
        return cachedDevice.features.major_version === 1 ? 25 : undefined; // 25s for T1, no fake progress for updating from older fw on T2
    };

    return (
        <>
            {(status === 'unplug' || status === 'reconnect-in-normal') && (
                // Modal to instruct user to disconnect the device and reconnect in normal mode
                <ReconnectDevicePrompt
                    deviceVersion={cachedDevice?.features?.major_version || 2}
                    requestedMode="normal"
                />
            )}
            <OnboardingStepBox
                image="FIRMWARE"
                heading={
                    status === 'partially-done' ? (
                        <Translation id="TR_FIRMWARE_PARTIALLY_UPDATED" />
                    ) : (
                        <Translation id="TR_INSTALL_FIRMWARE" />
                    )
                }
                confirmOnDevice={
                    status === 'waiting-for-confirmation'
                        ? device?.features?.major_version
                        : undefined
                }
                innerActions={
                    status === 'wait-for-reboot' && isWebUSB ? (
                        // Device needs to be paired twice when using web usb transport.
                        // Once in bootloader mode and once in normal mode. Without 2nd pairing step would get stuck at waiting for
                        // a reboot in case of fresh device which is, from the start, in bootloader mode (thus first time paired as a bootloader device).
                        // Suite won't detect such a restarted device, which will be now in normal mode, till it is paired again.
                        <WebusbButton ready>
                            <Button icon="SEARCH" variant="primary">
                                <Translation id="TR_CHECK_FOR_DEVICES" />
                            </Button>
                        </WebusbButton>
                    ) : undefined
                }
                outerActions={
                    // Show continue button after the installation is completed
                    status === 'done' || status === 'partially-done' ? (
                        // todo: this needs to be different action in separate fw flow
                        <Button
                            variant="primary"
                            onClick={status === 'done' ? () => goToNextStep() : resetReducer}
                            data-test="@firmware/continue-button"
                        >
                            <Translation id="TR_CONTINUE" />
                        </Button>
                    ) : undefined
                }
            >
                {cachedDevice.firmwareRelease?.isLatest && (
                    // If the proposed fw update is not latest it means we are gonna install intermediary firmware.
                    // firmwareRelease will be set to newest release supported by the bootloader. It is fw 1.6.1 for bootloader version 1.4.0,
                    // which is not the latest fw that will be installed as a subsequent fw update after installation of intermediary fw
                    // So let's just hide this part of UI in this case.
                    <FirmwareOffer
                        currentVersion={
                            cachedDevice.firmware !== 'none'
                                ? getFwVersion(cachedDevice)
                                : undefined
                        }
                        newVersion={getFwUpdateVersion(cachedDevice)}
                        releaseChangelog={cachedDevice.firmwareRelease}
                    />
                )}

                {status !== 'waiting-for-confirmation' &&
                    (status !== 'started' || cachedDevice.firmware === 'none') && (
                        // Progress bar shown in 'installing', 'wait-for-reboot', 'unplug', 'reconnect-in-normal', 'partially-done', 'done'
                        // Also in 'started' if the device has no fw (freshly unpacked device). In this case device won't ask for confirmation
                        // and starts installation right away. However it doesn't provide an installation progress till way later (we set status to 'installing' only after receiving UI.FIRMWARE_PROGRESS in firmware reducer)
                        <ProgressBar
                            key={subsequentInstalling ? 1 : 0} // will reset the progress after an installation of intermediary fw (subsequent fw update will follow)
                            label={statusText}
                            total={100}
                            current={installingProgress || 0}
                            fakeProgressDuration={getFakeProgressDuration()} // fake progress bar for T1 and devices without fw that will animate progress bar for up to xy seconds of installation
                        />
                    )}
            </OnboardingStepBox>
        </>
    );
};

export default FirmwareInstallation;
export { FirmwareInstallation };
