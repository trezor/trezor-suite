import { Button } from '@trezor/components';
import { UI } from '@trezor/connect';

import { Translation, WebUsbButton } from 'src/components/suite';
import { useFirmware } from 'src/hooks/suite';
import { FirmwareOffer, FirmwareProgressBar, ReconnectDevicePrompt } from 'src/components/firmware';
import { OnboardingStepBox } from 'src/components/onboarding';
import { TrezorDevice } from 'src/types/suite';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { useSelector } from 'src/hooks/suite/useSelector';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';

const SelectDevice = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${spacingsPx.lg};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;

interface FirmwareInstallationProps {
    cachedDevice?: TrezorDevice;
    // This component is shared between Onboarding flow and standalone fw update modal with few minor UI changes
    // If it is set to true, then you know it is being rendered in standalone fw update modal
    standaloneFwUpdate?: boolean;
    // If true, information about new version is not shown, because we don't know anything about it
    customFirmware?: boolean;
    install: () => void;
    onPromptClose?: () => void;
    onSuccess: () => void;
}

export const FirmwareInstallation = ({
    standaloneFwUpdate,
    customFirmware,
    install,
    onPromptClose,
    onSuccess,
}: FirmwareInstallationProps) => {
    const { status, isWebUSB, showReconnectPrompt, uiEvent, targetType } = useFirmware();
    const isActionAbortable = useSelector(selectIsActionAbortable);

    const getInnerActionComponent = () => {
        if (
            isWebUSB &&
            uiEvent?.type === UI.FIRMWARE_RECONNECT &&
            uiEvent.payload.disconnected &&
            uiEvent.payload.i > 2 && // Add some latency for cases when the device is already paired or is restarting.
            status !== 'done'
        ) {
            // Device needs to be paired twice when using web usb transport.
            // Once in bootloader mode and once in normal mode. Without 2nd pairing step would get stuck at waiting for
            // a reboot in case of fresh device which is, from the start, in bootloader mode (thus first time paired as a bootloader device).
            // Suite won't detect such a restarted device, which will be now in normal mode, till it is paired again.
            return (
                <SelectDevice>
                    <Translation id="TR_SELECT_TREZOR_TO_CONTINUE" />
                    <WebUsbButton translationId="TR_SELECT_TREZOR" size="medium" icon={false} />
                </SelectDevice>
            );
        }
        if (status === 'done') {
            return (
                <Button
                    variant="primary"
                    onClick={onSuccess}
                    data-testid="@firmware/continue-button"
                >
                    <Translation id={standaloneFwUpdate ? 'TR_CLOSE' : 'TR_CONTINUE'} />
                </Button>
            );
        }
    };

    return (
        <>
            {showReconnectPrompt && (
                <ReconnectDevicePrompt onClose={onPromptClose} onSuccess={install} />
            )}
            <OnboardingStepBox
                image="FIRMWARE"
                heading={<Translation id="TR_INSTALL_FIRMWARE" />}
                device={undefined}
                isActionAbortable={isActionAbortable}
                innerActions={getInnerActionComponent()}
                nested={!!standaloneFwUpdate}
                disableConfirmWrapper={!!standaloneFwUpdate}
            >
                <FirmwareOffer customFirmware={customFirmware} targetFirmwareType={targetType} />
                <FirmwareProgressBar />
            </OnboardingStepBox>
        </>
    );
};
