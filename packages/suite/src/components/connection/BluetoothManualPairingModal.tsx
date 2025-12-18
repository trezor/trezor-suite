import { Modal, Paragraph } from '@trezor/components';

import { setBluetoothDeviceNeedsManualPairing } from 'src/actions/bluetooth//desktopBluetoothReducer';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch } from 'src/hooks/suite';

type BluetoothManualPairingModalProps = {
    onCancel: () => void;
};

export const BluetoothManualPairingModal = ({ onCancel }: BluetoothManualPairingModalProps) => {
    const dispatch = useDispatch();
    const handleCancel = () => {
        dispatch(setBluetoothDeviceNeedsManualPairing(false));
        onCancel();
    };

    return (
        <Modal
            heading={<Translation id="TR_BLUETOOTH_REQUIRE_MANUAL_PAIRING" />}
            width={600}
            onCancel={handleCancel}
            bottomContent={
                <>
                    <Modal.Button onClick={handleCancel} intent="neutral" priority="secondary">
                        <Translation id="TR_DONE" />
                    </Modal.Button>
                </>
            }
        >
            <Paragraph>
                <Translation id="TR_BLUETOOTH_REQUIRE_MANUAL_PAIRING_TEXT" />
            </Paragraph>
        </Modal>
    );
};
