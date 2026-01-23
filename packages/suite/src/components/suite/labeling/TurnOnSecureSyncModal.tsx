import { Translation } from '@suite/intl';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Card, IconCircle, List, Modal, Paragraph } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { useDevice, useDispatch } from '../../../hooks/suite';
import { useSuiteServices } from '../../../support/SuiteServicesProvider';

type TurnOnSecureSyncModalProps = {
    onClose: () => void;
};

export const TurnOnSecureSyncModal = ({ onClose }: TurnOnSecureSyncModalProps) => {
    const { suiteSync } = useSuiteServices();
    const dispatch = useDispatch();

    const { device } = useDevice();

    const onSwitch = async () => {
        const result = await suiteSync.turnOnSuiteSync({
            deviceStaticSessionId: device?.state?.staticSessionId,
        });

        if (!result.success) {
            const { type } = result.error;
            switch (type) {
                case 'SuiteSyncUnavailableOnDeviceError':
                case 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType':
                case 'DeviceCancelled':
                case 'DeviceError':
                    dispatch(notificationsActions.addToast({ type: 'error', error: type }));

                    return;
                default:
                    return exhaustive(type);
            }
        }

        onClose();
    };

    return (
        <Modal
            heading={<Translation id="TR_TURN_ON_SECURE_SYNC_LABELS_MODAL_HEADING" />}
            description={<Translation id="TR_TURN_ON_SECURE_SYNC_LABELS_MODAL_DESCRIPTION" />}
            onCancel={onClose}
            width={600}
            bottomContent={
                <>
                    <Modal.Button onClick={onSwitch}>
                        <Translation id="TR_TURN_ON_SECURE_SYNC" />
                    </Modal.Button>
                    <Modal.Button onClick={onClose} intent="neutral" priority="secondary">
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Card paddingType="large">
                <List gap={16} variant="tertiary">
                    <List.Item
                        bulletComponent={
                            <IconCircle
                                name="cloudX"
                                hasBorder={false}
                                paddingType="medium"
                                size={40}
                            />
                        }
                    >
                        <Paragraph>
                            <Translation id="TR_TURN_ON_SECURE_SYNC_DATA_STORED_LOCALLY" />
                        </Paragraph>
                    </List.Item>
                    <List.Item
                        bulletComponent={
                            <IconCircle
                                name="desktopTower"
                                hasBorder={false}
                                paddingType="medium"
                                size={40}
                            />
                        }
                    >
                        <Paragraph>
                            <Translation id="TR_TURN_ON_SECURE_SYNC_ONLY_AUTHORIZED_DEVICES" />
                        </Paragraph>
                    </List.Item>
                </List>
            </Card>
        </Modal>
    );
};
