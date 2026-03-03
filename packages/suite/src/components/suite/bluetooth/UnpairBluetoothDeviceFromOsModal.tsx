import { useState } from 'react';

import { Translation } from '@suite/intl';
import { bluetoothActions } from '@suite-common/bluetooth';
import { Banner, Column, H3, Modal, Paragraph, Spinner } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { openSystemSettingsThunk } from 'src/actions/bluetooth/openSystemSettingsThunk';
import { toggleConnectionModal } from 'src/actions/device/deviceSlice';

import { selectIsUnpairingDevice } from '../../../actions/bluetooth/desktopBluetoothSelectors';
import { useDispatch, useSelector } from '../../../hooks/suite';

type UnpairBluetoothDeviceFromOsModalProps = {
    onFinish?: () => void;
};

export const UnpairBluetoothDeviceFromOsModal = ({
    onFinish,
}: UnpairBluetoothDeviceFromOsModalProps) => {
    const dispatch = useDispatch();
    const isUnpairingDevice = useSelector(selectIsUnpairingDevice);

    const [hasDeeplinkFailed, setHasDeeplinkFailed] = useState(false);

    const handleOpenBluetoothSettings = async () => {
        const result = await dispatch(openSystemSettingsThunk({ type: 'bluetooth' })).unwrap();

        if (!result.success) {
            setHasDeeplinkFailed(true);
        }
    };

    const onCancel = () => {
        dispatch(bluetoothActions.setIsDeviceOsUnpairingRequired(false));
        dispatch(toggleConnectionModal());
        onFinish?.();
    };

    if (isUnpairingDevice) {
        return (
            <Modal>
                <Column gap={spacings.md}>
                    <H3>
                        <Translation id="TR_BLUETOOTH_UNPAIRING" />
                    </H3>
                    <Spinner size={32} isDisabled={true} />
                </Column>
            </Modal>
        );
    }

    return (
        <Modal
            onCancel={onCancel}
            intent="brand"
            bottomContent={
                <>
                    <Modal.Button
                        onClick={handleOpenBluetoothSettings}
                        data-testid="@wipe/open-bluetooth-settings"
                    >
                        <Translation id="TR_BLUETOOTH_OPEN_BLUETOOTH_SETTINGS" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                        <Translation id="TR_DONE_REMOVING_TREZOR_FROM_SETTINGS" />
                    </Modal.Button>
                </>
            }
        >
            <H3>
                <Translation id="TR_BLUETOOTH_REMOVE_FROM_BLUETOOTH_SETTINGS" />
            </H3>
            <Paragraph intent="neutral" priority="secondary" margin={{ top: spacings.xs }}>
                <Translation id="TR_BLUETOOTH_REMOVE_FROM_BLUETOOTH_SETTINGS_DESCRIPTION" />
            </Paragraph>
            {hasDeeplinkFailed && (
                <Banner
                    intent="warning"
                    description={<Translation id="TR_BLUETOOTH_CANNOT_OPEN_BLUETOOTH_SETTINGS" />}
                />
            )}
        </Modal>
    );
};
