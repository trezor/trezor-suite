import { useEffect } from 'react';

import { Translation } from '@suite/intl';
import { Column, Illustration, Modal, Paragraph } from '@trezor/components';
import TrezorConnect, { DEVICE, DEVICE_EVENT, type DeviceEventMessage } from '@trezor/connect';

/**
 * Prompts the user to unplug the device. Calls `onDisconnect` with the
 * device ID when the device is physically disconnected.
 */
export const UnplugDeviceModal = ({
    onCancel,
    onDisconnect,
}: {
    onCancel: () => void;
    onDisconnect: (deviceId: string) => void;
}) => {
    useEffect(() => {
        const handleDeviceEvent = (event: DeviceEventMessage) => {
            if (event.type === DEVICE.DISCONNECT) {
                if (event.payload.id) {
                    onDisconnect(event.payload.id);
                }
                onCancel();
            }
        };

        TrezorConnect.on(DEVICE_EVENT, handleDeviceEvent);

        return () => {
            TrezorConnect.off(DEVICE_EVENT, handleDeviceEvent);
        };
    }, [onCancel, onDisconnect]);

    return (
        <Modal width={400} height={420}>
            <Column gap={24} alignItems="center">
                <Illustration name="disconnectTrezor" width={224} />
                <Column gap={8} alignItems="center">
                    <Paragraph typographyStyle="headline-md" align="center">
                        <Translation id="TR_FORGET_DEVICE_MODAL_FINISH_FORGETTING_HEADING" />
                    </Paragraph>
                    <Paragraph align="center" typographyStyle="body-md" color="contentSecondary">
                        <Translation id="TR_FORGET_DEVICE_MODAL_DISCONNECT_SUBTITLE" />
                    </Paragraph>
                </Column>
            </Column>
        </Modal>
    );
};
