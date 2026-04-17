import { FirmwareProgressBar, useFirmwareDesktopUpdate } from '@suite/firmware-upgrade';
import { Translation } from '@suite/intl';
import { Banner, Card, Column } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import type TrezorConnectBrowser from '@trezor/connect/src/index-browser';

import { FirmwareOffer, ReconnectDevicePrompt, RotatingPhrases } from 'src/components/firmware';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectHasTransportOfType } from 'src/selectors/suite/suiteSelectors';

type FirmwareInstallationProps = {
    // If true, information about new version is not shown, because we don't know anything about it
    isCustomFirmware?: boolean;
    install: () => void;
    onPromptClose?: () => void;
};

export const FirmwareInstallation = ({
    isCustomFirmware,
    install,
    onPromptClose,
}: FirmwareInstallationProps) => {
    const { status, showReconnectPrompt, targetType, reconnectEvent, isSlow } =
        useFirmwareDesktopUpdate();
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const isBluetoothTransport = useSelector(selectHasTransportOfType('BluetoothTransport'));

    const displayIsSlow = isSlow && isBluetoothTransport;

    // Device needs to be paired twice when using web usb transport. // Once in
    // bootloader mode and once in normal mode. Without 2nd pairing step would get stuck at waiting for
    // a reboot in case of fresh device which is, from the start, in bootloader mode (thus first time
    // paired as a bootloader device). Suite won't detect such a restarted device, which will be now
    // in normal mode, till it is paired again.
    const isDeviceNotSelected =
        isWebUsbTransport &&
        reconnectEvent &&
        reconnectEvent.disconnected &&
        reconnectEvent.i > 2 && // Add some latency for cases when the device is already paired or is restarting.
        status !== 'done';

    return (
        <>
            {showReconnectPrompt && (
                <ReconnectDevicePrompt onClose={onPromptClose} onSuccess={install} />
            )}
            <Column gap={16}>
                {isDeviceNotSelected && (
                    <Banner
                        intent="info"
                        icon="trezorDevicesFilled"
                        rightContent={
                            <Banner.Button
                                onClick={() => {
                                    (
                                        TrezorConnect as typeof TrezorConnectBrowser
                                    ).requestWebUSBDevice();
                                }}
                            >
                                <Translation id="TR_SELECT_TREZOR" />
                            </Banner.Button>
                        }
                        description={<Translation id="TR_SELECT_TREZOR_TO_CONTINUE" />}
                    />
                )}
                {displayIsSlow && (
                    <Banner
                        intent="info"
                        icon="bluetooth"
                        description={<Translation id="TR_INSTALLATION_FW_SLOW_TIP_BANNER" />}
                    />
                )}
                <Card>
                    <Column gap={8}>
                        <FirmwareOffer
                            isCustomFirmware={isCustomFirmware}
                            targetFirmwareType={targetType}
                        />
                        <FirmwareProgressBar />
                    </Column>
                </Card>
                <RotatingPhrases />
            </Column>
        </>
    );
};
