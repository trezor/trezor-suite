import { Translation } from '@suite/intl';
import { Card, Icon, List, Modal, Paragraph } from '@trezor/components';

const ConfirmationContent = ({
    isBluetoothDevice,
    isBluetoothConnectedDevice,
}: {
    isBluetoothDevice: boolean;
    isBluetoothConnectedDevice: boolean;
}) => (
    <Card paddingType="normal">
        <List gap={24}>
            <List.Item bulletComponent={<Icon name="linkBreak" priority="secondary" size={20} />}>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation id="TR_FORGET_DEVICE_MODAL_BULLET_FORGET" />
                </Paragraph>
            </List.Item>
            {isBluetoothDevice && (
                <List.Item
                    bulletComponent={<Icon name="bluetoothSlash" priority="secondary" size={20} />}
                >
                    <Paragraph intent="neutral" priority="secondary">
                        {isBluetoothConnectedDevice ? (
                            <Translation id="TR_FORGET_DEVICE_MODAL_BLUETOOTH_REMOVED_AND_DISCONNECTED" />
                        ) : (
                            <Translation id="TR_FORGET_DEVICE_MODAL_BLUETOOTH_REMOVED" />
                        )}
                    </Paragraph>
                </List.Item>
            )}
            <List.Item bulletComponent={<Icon name="scroll" priority="secondary" size={20} />}>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation id="TR_FORGET_DEVICE_MODAL_BULLET_NOT_WIPE" />
                </Paragraph>
            </List.Item>
        </List>
    </Card>
);

export const ConfirmationModal = ({
    onConfirm,
    onCancel,
    isBluetoothDevice,
    isBluetoothConnectedDevice,
}: {
    onConfirm: () => void;
    onCancel: () => void;
    isBluetoothDevice: boolean;
    isBluetoothConnectedDevice: boolean;
}) => (
    <Modal
        onCancel={onCancel}
        heading={<Translation id="TR_FORGET_DEVICE_MODAL_HEADING" />}
        intent="warning"
        width={680}
        bottomContent={
            <>
                <Modal.Button onClick={onConfirm}>
                    <Translation id="TR_FORGET_DEVICE_MODAL_CONFIRM" />
                </Modal.Button>
                <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                    <Translation id="TR_CANCEL" />
                </Modal.Button>
            </>
        }
    >
        <ConfirmationContent
            isBluetoothDevice={isBluetoothDevice}
            isBluetoothConnectedDevice={isBluetoothConnectedDevice}
        />
    </Modal>
);
