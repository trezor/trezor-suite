import { useCallback, useMemo } from 'react';
import { Button } from '@trezor/components';
import { getTextForStatus } from 'src/utils/firmware';
import { Translation, WebUsbButton } from 'src/components/suite';
import { useDevice, useFirmware } from 'src/hooks/suite';
import { FirmwareOffer, FirmwareProgressBar, ReconnectDevicePrompt } from 'src/components/firmware';
import { OnboardingStepBox } from 'src/components/onboarding';
import { TrezorDevice } from 'src/types/suite';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { useSelector } from 'src/hooks/suite/useSelector';
import { DeviceModelInternal } from '@trezor/connect';

interface FirmwareInstallationProps {
    cachedDevice?: TrezorDevice;
    // This component is shared between Onboarding flow and standalone fw update modal with few minor UI changes
    // If it is set to true, then you know it is being rendered in standalone fw update modal
    standaloneFwUpdate?: boolean;
    // If true, information about new version is not shown, because we don't know anything about it
    customFirmware?: boolean;
    onSuccess: () => void;
    onClose?: () => void;
}

export const FirmwareInstallation = ({
    cachedDevice,
    standaloneFwUpdate,
    customFirmware,
    onSuccess,
    onClose,
}: FirmwareInstallationProps) => {
    const { device } = useDevice();
    const { status, installingProgress, resetReducer, isWebUSB, subsequentInstalling } =
        useFirmware();
    const cachedDeviceModelInternal = cachedDevice?.features?.internal_model;
    const isActionAbortable = useSelector(selectIsActionAbortable);

    const statusIntlId = getTextForStatus(status);
    const statusText = statusIntlId ? <Translation id={statusIntlId} /> : null;

    const getContinueAction = useCallback(() => {
        if (status === 'done') {
            onSuccess();
        } else {
            resetReducer();
        }
    }, [status, onSuccess, resetReducer]);

    const getFakeProgressDuration = () => {
        if (cachedDevice?.firmware === 'none') {
            // device without fw starts installation without a confirmation and we need to fake progress bar for both devices (UI.FIRMWARE_PROGRESS is sent too late)
            return cachedDeviceModelInternal === DeviceModelInternal.T1B1 ? 25 : 40; // T1B1 seems a bit faster
        }

        // Updating from older fw, device asks for confirmation, but sends first info about installation progress somewhat to late
        return cachedDeviceModelInternal === DeviceModelInternal.T1B1 ? 25 : undefined; // 25s for T1B1, no fake progress for updating from older fw on other devices
    };

    const InnerActionComponent = useMemo(() => {
        switch (status) {
            case 'wait-for-reboot':
                // Device needs to be paired twice when using web usb transport.
                // Once in bootloader mode and once in normal mode. Without 2nd pairing step would get stuck at waiting for
                // a reboot in case of fresh device which is, from the start, in bootloader mode (thus first time paired as a bootloader device).
                // Suite won't detect such a restarted device, which will be now in normal mode, till it is paired again.
                return isWebUSB && <WebUsbButton />;

            case 'done':
            case 'partially-done':
                return (
                    <Button
                        variant="primary"
                        onClick={getContinueAction}
                        data-test="@firmware/continue-button"
                    >
                        <Translation id={standaloneFwUpdate ? 'TR_CLOSE' : 'TR_CONTINUE'} />
                    </Button>
                );
            default:
                return undefined;
        }
    }, [status, isWebUSB, getContinueAction, standaloneFwUpdate]);

    return (
        <>
            {(status === 'unplug' || status === 'reconnect-in-normal') && (
                // Modal to instruct user to disconnect the device and reconnect in normal mode
                <ReconnectDevicePrompt
                    expectedDevice={cachedDevice}
                    requestedMode="normal"
                    onClose={onClose}
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
                device={status === 'waiting-for-confirmation' ? device : undefined}
                isActionAbortable={isActionAbortable}
                innerActions={InnerActionComponent}
                nested={!!standaloneFwUpdate}
                disableConfirmWrapper={!!standaloneFwUpdate}
            >
                {cachedDevice?.firmwareRelease && (
                    <FirmwareOffer device={cachedDevice} customFirmware={customFirmware} />
                )}

                {status !== 'waiting-for-confirmation' &&
                    (status !== 'started' || cachedDevice?.firmware === 'none') && (
                        // Progress bar shown in 'installing', 'wait-for-reboot', 'unplug', 'reconnect-in-normal', 'partially-done', 'done'
                        // Also in 'started' if the device has no fw (freshly unpacked device). In this case device won't ask for confirmation
                        // and starts installation right away. However it doesn't provide an installation progress till way later (we set status to 'installing' only after receiving UI.FIRMWARE_PROGRESS in firmware reducer)
                        <FirmwareProgressBar
                            key={subsequentInstalling ? 1 : 0} // will reset the progress after an installation of intermediary fw (subsequent fw update will follow)
                            label={statusText}
                            total={100}
                            current={installingProgress || 0}
                            fakeProgressDuration={getFakeProgressDuration()} // fake progress bar for T1B1 and devices without fw that will animate progress bar for up to xy seconds of installation
                        />
                    )}
            </OnboardingStepBox>
        </>
    );
};
