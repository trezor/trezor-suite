import { Card, IconCircle, List, Modal, Paragraph } from '@trezor/components';

import { useLabelingCombined } from 'src/hooks/suite/useLabelingCombined';

import { Translation } from '../Translation';

type TurnOnSecureSyncModalProps = {
    onClose: () => void;
};

export const TurnOnSecureSyncModal = ({ onClose }: TurnOnSecureSyncModalProps) => {
    const { enableSuiteSyncIfNeeded } = useLabelingCombined({
        deviceStaticSessionId: undefined,
    });

    const onSwitch = () => {
        enableSuiteSyncIfNeeded();
        onClose();
    };

    return (
        <Modal
            heading={<Translation id="TR_TURN_ON_SECURE_SYNC_LABELS_MODAL_HEADING" />}
            description={<Translation id="TR_TURN_ON_SECURE_SYNC_LABELS_MODAL_DESCRIPTION" />}
            onCancel={onClose}
            size="small"
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
