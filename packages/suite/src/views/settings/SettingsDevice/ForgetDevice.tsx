import { useRef, useState } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import {
    deviceActions,
    selectDeviceBluetoothId,
    selectDevices,
    selectIsDeviceConnectedViaBluetooth,
    selectIsThpDevice,
    selectSelectedDevice,
} from '@suite-common/device';
import * as deviceUtils from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    forgetSingleDevicePersistentDataThunk,
    selectHasRunningDiscovery,
} from '@suite-common/wallet-core';
import { Button, Card, Column, Icon, List, Modal, ModalProps, Paragraph } from '@trezor/components';

import { unpairCurrentBondThunk } from 'src/actions/bluetooth/bluetoothEraseBondsThunk';
import { openSystemSettingsThunk } from 'src/actions/bluetooth/openSystemSettingsThunk';
import { goto } from 'src/actions/suite/routerActions';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { ForgetBluetoothDeviceFromOsModal } from 'src/components/suite/bluetooth/ForgetBluetoothDeviceFromOsModal';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { StepCard } from './WipeDevice/WipeDeviceModal';

type ForgetStep = 'confirmation' | 'remove-from-os' | 'remove-from-trezor';

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
    const isThpDevice = Boolean(useSelector(selectIsThpDevice));

    // Capture initial BLE connection state — bleUnpair disconnects the device,
    // which would flip the live selector to false and break our flow logic.
    const wasBluetoothConnectedRef = useRef(isBluetoothConnectedDevice);

    if (!selectedDevice) {
        return null;
    }

    const forgetDevice = async ({
        skipBluetoothForget,
        toastType = 'device-forgotten',
    }: {
        skipBluetoothForget?: boolean;
        toastType?: 'device-forgotten' | 'device-will-be-forgotten';
    } = {}) => {
        const instances = deviceUtils.getDeviceInstances(selectedDevice, devices);

        await dispatch(
            forgetSingleDevicePersistentDataThunk({
                deviceId: selectedDevice.id,
                suppressOsUnpairingModal: true,
                skipBluetoothForget,
            }),
        );

        instances.forEach(instance => {
            dispatch(deviceActions.forgetDevice({ device: instance }));
        });

        dispatch(
            notificationsActions.addToast({
                type: toastType,
            }),
        );

        analytics.report({ type: events.switchDeviceForgetEvent.name });
        onCancel?.();
    };

    const handleConfirmClick = async () => {
        try {
            if (!isThpDevice) {
                // TS3/5 (non-Bluetooth): forget immediately, regardless of connection status
                await forgetDevice({ toastType: 'device-will-be-forgotten' });

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
        } catch (error) {
            console.error('Error in handleConfirmClick:', error);
        }
    };

    const handleOsRemovalConfirm = () => {
        setOsRemovalConfirmed(true);
    };

    const handleTrezorRemovalConfirm = () => {
        forgetDevice({ skipBluetoothForget: true });
        dispatch(goto('suite-index'));
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
                    isBluetoothDevice={isThpDevice}
                    isBluetoothConnectedDevice={isBluetoothConnectedDevice}
                />
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
                <ForgetBluetoothDeviceFromOsModal
                    onDone={() => forgetDevice({ skipBluetoothForget: true })}
                    onFinish={onCancel}
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
                        descriptionTypographyStyle="inherit"
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
                        descriptionTypographyStyle="inherit"
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
                        icon="trezorSafe7"
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
    const hasRunningDiscovery = useSelector(selectHasRunningDiscovery);

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
                    <ActionButton
                        onClick={handleClick}
                        intent="warning"
                        isDisabled={hasRunningDiscovery}
                    >
                        <Translation id="TR_FORGET" />
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
        </>
    );
};
