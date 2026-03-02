import { Translation } from '@suite/intl';
import { selectDeviceByStaticSessionId } from '@suite-common/device';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Card, Column, Icon, List, Modal, Paragraph } from '@trezor/components';
import { StaticSessionId } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { useDispatch, useSelector } from '../../../../hooks/suite';
import { useSuiteServices } from '../../../../support/SuiteServicesProvider';

type SuiteSyncTurnOnAndFwUpgradeModalProps = {
    deviceStaticSessionId: StaticSessionId;
    onClose: () => void;
    onSuccess: () => void;
};

export const SuiteSyncTurnOnModal = ({
    deviceStaticSessionId,
    onClose,
    onSuccess,
}: SuiteSyncTurnOnAndFwUpgradeModalProps) => {
    const dispatch = useDispatch();
    const { suiteSync } = useSuiteServices();

    const device = useSelector(state =>
        selectDeviceByStaticSessionId(state, deviceStaticSessionId),
    );

    if (device === undefined) {
        return null;
    }

    const onSwitch = async () => {
        const result = await suiteSync.turnOnSuiteSync({
            deviceStaticSessionId: deviceStaticSessionId ?? undefined,
        });

        if (!result.success) {
            const { type } = result.error;
            switch (type) {
                case 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType':
                    // Do nothing, Firmware Upgrade Modal will be shown declaratively
                    // because `selectIsTurnOnSuiteSyncInteractionNeeded` will return it

                    return;

                case 'WriteModeRequiredForAllocation':
                    // Do nothing, this is expected control flow error when we want allocate on-demand.
                    return;

                case 'SuiteSyncUnavailableOnDeviceError':
                case 'DeviceCancelled':
                case 'DeviceError':
                    dispatch(notificationsActions.addToast({ type: 'error', error: type }));

                    return;
                default:
                    return exhaustive(type);
            }
        }

        onSuccess();
    };

    return (
        <Modal
            heading={<Translation id="TR_TURN_ON_SECURE_SYNC_LABELS_MODAL_HEADING" />}
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
            <Column gap={16}>
                <Card paddingType="large">
                    <List gap={16} intent="neutral" priority="secondary">
                        <List.Item bulletComponent={<Icon name="tag" size={20} />}>
                            <Paragraph>
                                <Translation id="TR_TURN_ON_SECURE_SYNC_DATA_LABELS" />
                            </Paragraph>
                        </List.Item>
                        <List.Item
                            bulletComponent={<Icon name="arrowsCounterClockwise" size={20} />}
                        >
                            <Paragraph>
                                <Translation id="TR_TURN_ON_SECURE_SYNC_DATA_STORED_LOCALLY" />
                            </Paragraph>
                        </List.Item>
                        <List.Item bulletComponent={<Icon name="shieldCheck" size={20} />}>
                            <Paragraph>
                                <Translation id="TR_TURN_ON_SECURE_SYNC_ONLY_AUTHORIZED_DEVICES" />
                            </Paragraph>
                        </List.Item>
                    </List>
                </Card>
            </Column>
        </Modal>
    );
};
