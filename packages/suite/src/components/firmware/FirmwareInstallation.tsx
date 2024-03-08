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
    const { status, resetReducer, isWebUSB, uiEvent } = useFirmware();
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
        if (uiEvent?.type === 'ui-firmware_reconnect') {
            // Device needs to be paired twice when using web usb transport.
            // Once in bootloader mode and once in normal mode. Without 2nd pairing step would get stuck at waiting for
            // a reboot in case of fresh device which is, from the start, in bootloader mode (thus first time paired as a bootloader device).
            // Suite won't detect such a restarted device, which will be now in normal mode, till it is paired again.
            return isWebUSB && <WebUsbButton />;
        }
        switch (status) {
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
    }, [status, uiEvent, isWebUSB, getContinueAction, standaloneFwUpdate]);

    return (
        <>
            <OnboardingStepBox
                image="FIRMWARE"
                heading={
                    status === 'partially-done' ? (
                        <Translation id="TR_FIRMWARE_PARTIALLY_UPDATED" />
                    ) : (
                        <Translation id="TR_INSTALL_FIRMWARE" />
                    )
                }
                device={undefined}
                isActionAbortable={isActionAbortable}
                innerActions={InnerActionComponent}
                nested={!!standaloneFwUpdate}
                disableConfirmWrapper={!!standaloneFwUpdate}
            >
                meow
            </OnboardingStepBox>
        </>
    );
};
