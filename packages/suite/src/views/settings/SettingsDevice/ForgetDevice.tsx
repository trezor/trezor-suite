import { useState } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import * as deviceUtils from '@suite-common/suite-utils';
import { forgetDeviceThunk } from '@suite-common/wallet-core';
import { Card, Icon, List, Modal, type ModalProps, Paragraph } from '@trezor/components';

import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

export const ForgetDeviceModal = ({ onCancel }: ModalProps) => {
    const dispatch = useDispatch();
    const selectedDevice = useSelector(selectSelectedDevice);
    const analytics = useAnalytics();
    if (!selectedDevice) {
        return null;
    }

    const isBluetoothDevice = selectedDevice.features?.capabilities.includes('Capability_BLE');
    const isBluetoothConnectedDevice = selectedDevice?.descriptor.apiType === 'bluetooth';

    const handleConfirmClick = async () => {
        await dispatch(forgetDeviceThunk());

        analytics.report({ type: events.switchDeviceForgetEvent.name });
        onCancel?.();
    };

    return (
        <Modal
            onCancel={onCancel}
            heading={<Translation id="TR_FORGET_DEVICE_MODAL_HEADING" />}
            intent="warning"
            width={600}
            bottomContent={
                <>
                    <Modal.Button onClick={handleConfirmClick}>
                        <Translation id="TR_FORGET" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Card paddingType="large">
                <List gap={24}>
                    <List.Item
                        bulletComponent={
                            <Icon name="recycle" intent="neutral" priority="secondary" size={20} />
                        }
                    >
                        <Paragraph intent="neutral" priority="secondary">
                            <Translation id="TR_FORGET_DEVICE_MODAL_BULLET_FORGET" />
                        </Paragraph>
                    </List.Item>
                    {isBluetoothDevice && (
                        <List.Item
                            bulletComponent={
                                <Icon
                                    name="bluetoothSlash"
                                    intent="neutral"
                                    priority="secondary"
                                    size={20}
                                />
                            }
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
                    <List.Item
                        bulletComponent={
                            <Icon name="scroll" intent="neutral" priority="secondary" size={20} />
                        }
                    >
                        <Paragraph intent="neutral" priority="secondary">
                            <Translation id="TR_FORGET_DEVICE_MODAL_BULLET_NOT_WIPE" />
                        </Paragraph>
                    </List.Item>
                </List>
            </Card>
        </Modal>
    );
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
                    <ActionButton onClick={handleClick} intent="neutral" priority="secondary">
                        <Translation id="TR_FORGET" />
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
        </>
    );
};
