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
    const { status, installingProgress, resetReducer, isWebUSB } = useFirmware();
    const { goToNextStep } = useOnboarding();
    const statusIntlId = getTextForStatus(status);
    const statusText = statusIntlId ? <Translation id={statusIntlId} /> : null;

    return (
        <>
            {/* Modal to instruct user to disconnect the device and reconnect in normal mode */}
            {(status === 'unplug' || status === 'reconnect-in-normal') && (
                <ReconnectDevicePrompt
                    deviceVersion={cachedDevice?.features?.major_version || 2}
                    requestedMode="normal"
                />
            )}
            <OnboardingStepBox
                heading={<Translation id="TR_INSTALL_FIRMWARE" />}
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
                {console.log('cached Device', cachedDevice)}
                <FirmwareOffer
                    currentVersion={
                        cachedDevice.firmware !== 'none' ? getFwVersion(cachedDevice) : undefined
                    }
                    newVersion={getFwUpdateVersion(cachedDevice)}
                    releaseChangelog={cachedDevice.firmwareRelease}
                />

                {status !== 'waiting-for-confirmation' && status !== 'started' && (
                    // Progress bar shown only in 'installing', 'wait-for-reboot', 'unplug', 'reconnect-in-normal', 'done'
                    <ProgressBar
                        label={statusText}
                        total={100}
                        current={installingProgress || 0}
                        maintainCompletedState
                        fakeProgressDuration={
                            cachedDevice.features.major_version === 1 ? 25 : undefined
                        } // fake progress bar for T1 that will animate progress bar for up to 25s of installation
                    />
                )}
            </OnboardingStepBox>
        </>
    );
};

export default FirmwareInstallation;
export { FirmwareInstallation };
