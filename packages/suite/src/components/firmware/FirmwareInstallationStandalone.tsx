import { useFirmwareInstallation } from '@suite-common/firmware';
import { Banner, Card, Column } from '@trezor/components';
import TrezorConnect, { UI } from '@trezor/connect';
import type TrezorConnectWeb from '@trezor/connect-web';
import { spacings } from '@trezor/theme';

import { FirmwareOffer, FirmwareProgressBar, ReconnectDevicePrompt } from 'src/components/firmware';
import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectHasTransportOfType } from 'src/reducers/suite/suiteReducer';

type FirmwareInstallationStandaloneProps = {
    // If true, information about new version is not shown, because we don't know anything about it
    isCustomFirmware?: boolean;
    install: () => void;
    onPromptClose?: () => void;
};

export const FirmwareInstallationStandalone = ({
    isCustomFirmware,
    install,
    onPromptClose,
}: FirmwareInstallationStandaloneProps) => {
    const { status, showReconnectPrompt, uiEvent, targetType } = useFirmwareInstallation();
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));
    // Device needs to be paired twice when using web usb transport. // Once in
    // bootloader mode and once in normal mode. Without 2nd pairing step would get stuck at waiting for
    // a reboot in case of fresh device which is, from the start, in bootloader mode (thus first time
    // paired as a bootloader device). Suite won't detect such a restarted device, which will be now
    // in normal mode, till it is paired again.
    const isDeviceNotSelected =
        isWebUsbTransport &&
        uiEvent?.type === UI.FIRMWARE_RECONNECT &&
        uiEvent.payload.disconnected &&
        uiEvent.payload.i > 2 && // Add some latency for cases when the device is already paired or is restarting.
        status !== 'done';

    return (
        <>
            {showReconnectPrompt && (
                <ReconnectDevicePrompt onClose={onPromptClose} onSuccess={install} />
            )}
            <Column gap={spacings.md}>
                {isDeviceNotSelected && (
                    <Banner
                        variant="info"
                        icon="trezorDevicesFilled"
                        rightContent={
                            <Banner.Button
                                onClick={() => {
                                    (
                                        TrezorConnect as typeof TrezorConnectWeb
                                    ).requestWebUSBDevice();
                                }}
                            >
                                <Translation id="TR_SELECT_TREZOR" />
                            </Banner.Button>
                        }
                    >
                        <Translation id="TR_SELECT_TREZOR_TO_CONTINUE" />
                    </Banner>
                )}
                <Card>
                    <Column gap={spacings.xs}>
                        <FirmwareOffer
                            isCustomFirmware={isCustomFirmware}
                            targetFirmwareType={targetType}
                        />
                        <FirmwareProgressBar />
                    </Column>
                </Card>
            </Column>
        </>
    );
};
