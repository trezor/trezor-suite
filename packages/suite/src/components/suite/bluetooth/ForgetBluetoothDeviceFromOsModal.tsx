import { useState } from 'react';

import { Translation } from '@suite/intl';
import { bluetoothActions } from '@suite-common/bluetooth';
import { Banner, Column, H3, Modal, Paragraph, Spinner } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { openSystemSettingsThunk } from 'src/actions/bluetooth/openSystemSettingsThunk';
import { toggleConnectionModal } from 'src/actions/device/deviceSlice';

import { selectIsUnpairingDevice } from '../../../actions/bluetooth/desktopBluetoothSelectors';
import { useDispatch, useSelector } from '../../../hooks/suite';

export type ForgetBluetoothDeviceFromOsModalProps = {
    onFinish?: () => void;
    onDone?: () => void;
};

export const ForgetBluetoothDeviceFromOsModal = ({
    onFinish,
    onDone,
}: ForgetBluetoothDeviceFromOsModalProps) => {
    const dispatch = useDispatch();
    const isUnpairingDevice = useSelector(selectIsUnpairingDevice);

    const [hasDeeplinkFailed, setHasDeeplinkFailed] = useState(false);

    const handleOpenBluetoothSettings = async () => {
        const result = await dispatch(openSystemSettingsThunk({ type: 'bluetooth' })).unwrap();

        if (!result.success) {
            setHasDeeplinkFailed(true);
        }
    };

    const handleDismiss = () => {
        if (!onDone) {
            dispatch(bluetoothActions.setIsDeviceOsUnpairingRequired(false));
            dispatch(toggleConnectionModal());
        }
        onFinish?.();
    };

    const handleConfirm = () => {
        if (onDone) {
            onDone();
            onFinish?.();
        } else {
            handleDismiss();
        }
    };

    if (isUnpairingDevice) {
        return (
            <Modal>
                <Column gap={spacings.md} alignItems="center">
                    <H3>
                        <Translation id="TR_BLUETOOTH_UNPAIRING" />
                    </H3>
                    <Spinner size={32} />
                </Column>
            </Modal>
        );
    }

    return (
        <Modal
            heading={<Translation id="TR_BLUETOOTH_REMOVE_FROM_BLUETOOTH_SETTINGS" />}
            onCancel={handleDismiss}
            width={600}
            data-testid="@bluetooth/unpair-modal"
            bottomContent={
                <>
                    <Modal.Button
                        intent="brand"
                        onClick={handleOpenBluetoothSettings}
                        data-testid="@wipe/open-bluetooth-settings"
                    >
                        <Translation id="TR_BLUETOOTH_OPEN_BLUETOOTH_SETTINGS" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={handleConfirm}>
                        <Translation id="TR_GOT_IT" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={spacings.md} alignItems="stretch">
                <Column gap={spacings.xs}>
                    <Paragraph intent="neutral" priority="secondary">
                        <Translation id="TR_BLUETOOTH_REMOVE_FROM_BLUETOOTH_SETTINGS_DESCRIPTION" />
                    </Paragraph>
                </Column>

                {hasDeeplinkFailed && (
                    <Banner
                        intent="warning"
                        description={
                            <Translation id="TR_BLUETOOTH_CANNOT_OPEN_BLUETOOTH_SETTINGS" />
                        }
                    />
                )}
            </Column>
        </Modal>
    );
};
