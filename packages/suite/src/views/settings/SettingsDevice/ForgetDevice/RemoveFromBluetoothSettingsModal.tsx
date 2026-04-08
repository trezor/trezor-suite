import { Translation } from '@suite/intl';
import { Modal, Paragraph } from '@trezor/components';

import { openSystemSettingsThunk } from 'src/actions/bluetooth/openSystemSettingsThunk';
import { useDispatch } from 'src/hooks/suite';

export const RemoveFromBluetoothSettingsModal = ({
    onCancel,
    onGotIt,
}: {
    onCancel: () => void;
    onGotIt: () => void;
}) => {
    const dispatch = useDispatch();

    const handleOpenBluetoothSettings = () => {
        dispatch(openSystemSettingsThunk({ type: 'bluetooth' }));
    };

    return (
        <Modal
            data-testid="@settings/device/forget-bt-removal-modal"
            onCancel={onCancel}
            heading={<Translation id="TR_FORGET_DEVICE_MODAL_FINISH_HEADING" />}
            width={600}
            bottomContent={
                <>
                    <Modal.Button onClick={handleOpenBluetoothSettings}>
                        <Translation id="TR_BLUETOOTH_OPEN_BLUETOOTH_SETTINGS" />
                    </Modal.Button>
                    <Modal.Button
                        data-testid="@settings/device/forget-bt-removal-got-it"
                        intent="neutral"
                        priority="secondary"
                        onClick={onGotIt}
                    >
                        <Translation id="TR_GOT_IT" />
                    </Modal.Button>
                </>
            }
        >
            <Paragraph>
                <Translation id="TR_BLUETOOTH_REMOVE_FROM_BLUETOOTH_SETTINGS_DESCRIPTION" />
            </Paragraph>
        </Modal>
    );
};
