import { Button } from '@trezor/components';
import { UI } from '@trezor/connect';

import { Translation, WebUsbButton } from 'src/components/suite';
import { useFirmware } from 'src/hooks/suite';
import { FirmwareOffer, FirmwareProgressBar } from 'src/components/firmware';
import { OnboardingStepBox } from 'src/components/onboarding';
import { TrezorDevice } from 'src/types/suite';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { useSelector } from 'src/hooks/suite/useSelector';

interface FirmwareInstallationProps {
    cachedDevice?: TrezorDevice;
    // This component is shared between Onboarding flow and standalone fw update modal with few minor UI changes
    // If it is set to true, then you know it is being rendered in standalone fw update modal
    standaloneFwUpdate?: boolean;
    // If true, information about new version is not shown, because we don't know anything about it
    customFirmware?: boolean;
    onSuccess: () => void;
}

export const FirmwareInstallation = ({
    standaloneFwUpdate,
    customFirmware,
    onSuccess,
}: FirmwareInstallationProps) => {
    const { status, resetReducer, isWebUSB, uiEvent } = useFirmware();
    const isActionAbortable = useSelector(selectIsActionAbortable);

    const device = uiEvent?.payload.device;

    const continueAction = () => (status === 'done' ? onSuccess() : resetReducer());
    const getInnerActionComponent = () => {
        if (uiEvent?.type === UI.FIRMWARE_RECONNECT && !uiEvent.payload.bootloader && isWebUSB) {
            // Device needs to be paired twice when using web usb transport.
            // Once in bootloader mode and once in normal mode. Without 2nd pairing step would get stuck at waiting for
            // a reboot in case of fresh device which is, from the start, in bootloader mode (thus first time paired as a bootloader device).
            // Suite won't detect such a restarted device, which will be now in normal mode, till it is paired again.
            return <WebUsbButton />;
        }
        if (status === 'done') {
            return (
                <Button
                    variant="primary"
                    onClick={continueAction}
                    data-test="@firmware/continue-button"
                >
                    <Translation id={standaloneFwUpdate ? 'TR_CLOSE' : 'TR_CONTINUE'} />
                </Button>
            );
        }
    };

    return (
        <>
            <OnboardingStepBox
                image="FIRMWARE"
                heading={<Translation id="TR_INSTALL_FIRMWARE" />}
                device={undefined}
                isActionAbortable={isActionAbortable}
                innerActions={getInnerActionComponent()}
                nested={!!standaloneFwUpdate}
                disableConfirmWrapper={!!standaloneFwUpdate}
            >
                {device?.firmwareRelease && (
                    <FirmwareOffer device={device} customFirmware={customFirmware} />
                )}
                <FirmwareProgressBar />
            </OnboardingStepBox>
        </>
    );
};
