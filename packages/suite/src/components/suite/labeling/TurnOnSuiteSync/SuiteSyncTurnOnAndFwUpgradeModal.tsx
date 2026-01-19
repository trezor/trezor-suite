import { Translation } from '@suite/intl';
import { isFwUpgradeNeededForSuiteSync } from '@suite-common/suite-sync';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectDeviceByStaticSessionId } from '@suite-common/wallet-core';
import { Banner, Card, Column, IconCircle, List, Modal, Paragraph } from '@trezor/components';
import { StaticSessionId } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { goto } from '../../../../actions/suite/routerActions';
import { useDispatch, useSelector } from '../../../../hooks/suite';
import { useSuiteServices } from '../../../../support/SuiteServicesProvider';

type SuiteSyncTurnOnAndFwUpgradeModalProps = {
    deviceStaticSessionId: StaticSessionId;
    onClose: () => void;
};

export const SuiteSyncTurnOnAndFwUpgradeModal = ({
    deviceStaticSessionId,
    onClose,
}: SuiteSyncTurnOnAndFwUpgradeModalProps) => {
    const dispatch = useDispatch();
    const { suiteSync } = useSuiteServices();

    const device = useSelector(state =>
        deviceStaticSessionId !== null
            ? selectDeviceByStaticSessionId(state, deviceStaticSessionId)
            : undefined,
    );

    const isFwUpgradeNeeded = isFwUpgradeNeededForSuiteSync(device);

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
                    // Update will disconnect device in the process and our Firmware Update
                    // flow won't allow us to navigate back. So we just redirect the user
                    // and close the modal.
                    dispatch(goto('firmware-index', { params: { cancelable: true } }));
                    onClose();

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
                        <Translation
                            id={
                                isFwUpgradeNeeded
                                    ? 'TR_TURN_ON_SECURE_SYNC_MODAL_TURN_ON_AND_UPGRADE'
                                    : 'TR_TURN_ON_SECURE_SYNC'
                            }
                        />
                    </Modal.Button>
                    <Modal.Button onClick={onClose} intent="neutral" priority="secondary">
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={16}>
                <Card paddingType="large">
                    <List gap={16} variant="tertiary">
                        <List.Item
                            bulletComponent={
                                <IconCircle
                                    name="tag"
                                    hasBorder={false}
                                    paddingType="medium"
                                    size={40}
                                />
                            }
                        >
                            <Paragraph>
                                <Translation id="TR_TURN_ON_SECURE_SYNC_DATA_LABELS" />
                            </Paragraph>
                        </List.Item>
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
                {isFwUpgradeNeeded && (
                    <Banner
                        intent="info"
                        icon="password"
                        description={
                            <Paragraph typographyStyle="hint">
                                <Translation id="TR_NEEDS_ATTENTION_FIRMWARE_REQUIRED" />
                            </Paragraph>
                        }
                    />
                )}
            </Column>
        </Modal>
    );
};
