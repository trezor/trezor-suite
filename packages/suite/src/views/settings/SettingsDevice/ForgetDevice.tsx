import { ReactNode, useRef, useState } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import {
    deviceActions,
    selectDeviceBluetoothId,
    selectDevices,
    selectIsDeviceConnectedViaBluetooth,
    selectSelectedDevice,
} from '@suite-common/device';
import * as deviceUtils from '@suite-common/suite-utils';
import { forgetSingleDevicePersistentDataThunk } from '@suite-common/wallet-core';
import {
    Button,
    Card,
    Column,
    Divider,
    Icon,
    IconName,
    List,
    Modal,
    ModalProps,
    Paragraph,
    Row,
    Text,
} from '@trezor/components';

import { unpairCurrentBondThunk } from 'src/actions/bluetooth/bluetoothEraseBondsThunk';
import { openSystemSettingsThunk } from 'src/actions/bluetooth/openSystemSettingsThunk';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { UnpairBluetoothDeviceFromOsModal } from 'src/components/suite/bluetooth/UnpairBluetoothDeviceFromOsModal';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

type ForgetStep =
    | 'confirmation'
    | 'waiting-for-disconnect'
    | 'remove-from-os'
    | 'remove-from-trezor';

type StepCardProps = {
    heading: ReactNode;
    description: ReactNode;
    actions: ReactNode;
    icon: IconName;
    state: 'default' | 'confirmed' | 'pending';
};

const StepCard = ({ heading, description, actions, icon, state }: StepCardProps) => {
    const priority = state === 'confirmed' ? 'primary' : 'tertiary';
    const textIntent = state === 'confirmed' ? 'brand' : 'neutral';
    const textPriority = state === 'confirmed' ? 'primary' : 'secondary';

    return (
        <Card paddingType="none" fillType={state === 'pending' ? 'flat' : 'default'}>
            <Column>
                <Row gap={8} padding={{ horizontal: 16, vertical: 12 }}>
                    <Icon
                        name={state === 'confirmed' ? 'check' : icon}
                        priority={priority}
                        size={20}
                    />
                    <Text typographyStyle="body-sm" intent={textIntent} priority={textPriority}>
                        {heading}
                    </Text>
                </Row>
                {state === 'default' && (
                    <>
                        <Divider margin={0} />
                        <Column gap={16} padding={{ horizontal: 16, vertical: 12 }}>
                            <Paragraph typographyStyle="body-md-strong">{description}</Paragraph>
                            <Row gap={12}>{actions}</Row>
                        </Column>
                    </>
                )}
            </Column>
        </Card>
    );
};

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

export const ForgetDeviceModal = ({ onCancel }: ModalProps) => {
    const [step, setStep] = useState<ForgetStep>('confirmation');
    const [osRemovalConfirmed, setOsRemovalConfirmed] = useState(false);
    const dispatch = useDispatch();
    const selectedDevice = useSelector(selectSelectedDevice);
    const devices = useSelector(selectDevices);
    const analytics = useAnalytics();
    const isBluetoothConnectedDevice = useSelector(selectIsDeviceConnectedViaBluetooth);
    const bluetoothId = useSelector(selectDeviceBluetoothId);

    // Capture initial BLE connection state — bleUnpair disconnects the device,
    // which would flip the live selector to false and break our flow logic.
    const wasBluetoothConnectedRef = useRef(isBluetoothConnectedDevice);

    if (!selectedDevice) {
        return null;
    }

    const isBluetoothDevice = !!selectedDevice.features?.capabilities?.includes('Capability_BLE');
    const isDeviceConnected = !!selectedDevice.connected;

    const forgetDevice = ({ skipBluetoothForget }: { skipBluetoothForget?: boolean } = {}) => {
        const instances = deviceUtils.getDeviceInstances(selectedDevice, devices);
        dispatch(
            forgetSingleDevicePersistentDataThunk({
                deviceId: selectedDevice.id,
                suppressOsUnpairingModal: true,
                skipBluetoothForget,
            }),
        );
        instances.forEach(instance => {
            dispatch(deviceActions.forgetDevice({ device: instance }));
        });
        analytics.report({ type: events.switchDeviceForgetEvent.name });
        onCancel?.();
    };

    const handleConfirmClick = async () => {
        if (!isBluetoothDevice) {
            if (isDeviceConnected) {
                // TS3/5 connected: inform user, forget after disconnect
                setStep('waiting-for-disconnect');
            } else {
                // TS3/5 disconnected: forget immediately
                forgetDevice();
            }

            return;
        }

        if (wasBluetoothConnectedRef.current) {
            // TS7 connected: bleUnpair first (user confirms on device via
            // TrezorConnect's own "Follow instructions" UI), then show
            // the "Remove from Bluetooth settings" modal.
            // Note: we do NOT call forgetBluetoothDeviceThunk here because
            // bleUnpair already disconnects the peripheral, making OS-level
            // forget fail with "Peripheral not found". The user will handle
            // OS removal manually via UnpairBluetoothDeviceFromOsModal.
            if (bluetoothId) {
                await dispatch(unpairCurrentBondThunk({ bluetoothId, skipDisconnect: true }));
            }

            setStep('remove-from-os');
        } else {
            // TS7 disconnected: start with OS BT removal step
            setStep('remove-from-os');
        }
    };

    const handleOsRemovalConfirm = () => {
        setOsRemovalConfirmed(true);
    };

    const handleTrezorRemovalConfirm = () => {
        forgetDevice({ skipBluetoothForget: true });
    };

    const handleOpenBluetoothSettings = () => {
        dispatch(openSystemSettingsThunk({ type: 'bluetooth' }));
    };

    // Step 1: Confirmation modal (same for all device types)
    if (step === 'confirmation') {
        return (
            <Modal
                onCancel={onCancel}
                heading={<Translation id="TR_FORGET_DEVICE_MODAL_HEADING" />}
                intent="warning"
                width={680}
                bottomContent={
                    <>
                        <Modal.Button onClick={handleConfirmClick}>
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
    }

    // TS3/5 connected: inform user the device will be forgotten after disconnecting
    if (step === 'waiting-for-disconnect') {
        return (
            <Modal
                onCancel={onCancel}
                heading={<Translation id="TR_FORGET_DEVICE_MODAL_HEADING" />}
                width={600}
                bottomContent={
                    <Modal.Button onClick={() => forgetDevice()}>
                        <Translation id="TR_FORGET_DEVICE_MODAL_CONFIRM" />
                    </Modal.Button>
                }
            >
                <Card paddingType="large">
                    <Paragraph intent="neutral" priority="secondary">
                        <Translation id="TR_FORGET_DEVICE_MODAL_FORGOTTEN_AFTER_DISCONNECT" />
                    </Paragraph>
                </Card>
            </Modal>
        );
    }

    // Step 2: Remove from OS Bluetooth settings
    if (step === 'remove-from-os') {
        // TS7 connected: reuse the standard "Remove from Bluetooth settings" modal.
        // skipBluetoothForget because forgetBluetoothDeviceThunk was already called
        // in handleConfirmClick after bleUnpair.
        if (wasBluetoothConnectedRef.current) {
            return (
                <UnpairBluetoothDeviceFromOsModal
                    onFinish={() => forgetDevice({ skipBluetoothForget: true })}
                />
            );
        }

        // TS7 disconnected: OS removal on top, Trezor removal below
        return (
            <Modal
                onCancel={onCancel}
                heading={<Translation id="TR_FORGET_DEVICE_MODAL_FINISH_HEADING" />}
                width={600}
            >
                <Column gap={16}>
                    <StepCard
                        heading={<Translation id="TR_FORGET_DEVICE_MODAL_ON_YOUR_COMPUTER" />}
                        description={
                            <Translation
                                id="TR_FORGET_DEVICE_MODAL_REMOVE_FROM_OS"
                                values={{
                                    b: chunks => <b>{chunks}</b>,
                                    link: chunks => (
                                        <button
                                            type="button"
                                            style={{
                                                cursor: 'pointer',
                                                textDecoration: 'underline',
                                                fontWeight: 'inherit',
                                                background: 'none',
                                                border: 'none',
                                                padding: 0,
                                                font: 'inherit',
                                                color: 'inherit',
                                            }}
                                            onClick={handleOpenBluetoothSettings}
                                        >
                                            {chunks}
                                        </button>
                                    ),
                                }}
                            />
                        }
                        actions={
                            <Button intent="brand" onClick={handleOsRemovalConfirm} size="large">
                                <Translation id="TR_FORGET_DEVICE_MODAL_IVE_REMOVED_IT" />
                            </Button>
                        }
                        icon="laptop"
                        state={osRemovalConfirmed ? 'confirmed' : 'default'}
                    />
                    <StepCard
                        heading={<Translation id="TR_FORGET_DEVICE_MODAL_ON_YOUR_TREZOR" />}
                        description={
                            <Translation
                                id="TR_FORGET_DEVICE_MODAL_REMOVE_FROM_TREZOR"
                                values={{
                                    b: chunks => <b>{chunks}</b>,
                                }}
                            />
                        }
                        actions={
                            <Button
                                intent="brand"
                                onClick={handleTrezorRemovalConfirm}
                                size="large"
                            >
                                <Translation id="TR_FORGET_DEVICE_MODAL_IVE_REMOVED_IT" />
                            </Button>
                        }
                        icon="deviceMobile"
                        state={osRemovalConfirmed ? 'default' : 'pending'}
                    />
                </Column>
            </Modal>
        );
    }

    // Step 4: Remove host from Trezor device (should not reach here with new flow)
    return null;
};

export const ForgetDevice = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const selectedDevice = useSelector(selectSelectedDevice);

    if (!selectedDevice || !deviceUtils.isDeviceAcquired(selectedDevice)) {
        return null;
    }

    const handleClick = () => setIsModalOpen(true);
    const handleModalCancel = () => setIsModalOpen(false);

    return (
        <>
            {isModalOpen && <ForgetDeviceModal onCancel={handleModalCancel} />}
            <SectionItem data-test="@settings/device/forget">
                <TextColumn
                    title={<Translation id="TR_FORGET_DEVICE_HEADING" />}
                    description={<Translation id="TR_FORGET_DEVICE_DESCRIPTION" />}
                />
                <ActionColumn>
                    <ActionButton onClick={handleClick} intent="warning">
                        <Translation id="TR_FORGET" />
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
        </>
    );
};
