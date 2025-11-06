import { Card, Icon, List, Modal, Paragraph } from '@trezor/components';

import { useLabelingCombined } from 'src/hooks/suite/useLabelingCombined';

import { Translation } from '../Translation';

type TurnOnSecureSyncModalProps = {
    onClose: () => void;
};

export const TurnOnSecureSyncModal = ({ onClose }: TurnOnSecureSyncModalProps) => {
    const { enableLocalFirstStorageIfNeeded } = useLabelingCombined({
        deviceStaticSessionId: undefined,
    });

    const onSwitch = () => {
        enableLocalFirstStorageIfNeeded();
        onClose();
    };

    return (
        <Modal
            heading={<Translation id="TR_TURN_ON_SECURE_SYNC_LABELS_MODAL_HEADING" />}
            description={<Translation id="TR_TURN_ON_SECURE_SYNC_LABELS_MODAL_DESCRIPTION" />}
            onCancel={onClose}
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
            <Card>
                <List
                    bulletGap={0}
                    gap={0}
                    bulletComponent={<Icon name="dot" variant="tertiary" size={32} />}
                >
                    <List.Item>
                        <Paragraph variant="tertiary">
                            <Translation id="TR_TURN_ON_SECURE_SYNC_DATA_STORED_LOCALLY" />
                        </Paragraph>
                    </List.Item>
                    <List.Item>
                        <Paragraph variant="tertiary">
                            <Translation id="TR_TURN_ON_SECURE_SYNC_ONLY_AUTHORIZED_DEVICES" />
                        </Paragraph>
                    </List.Item>
                </List>
            </Card>
        </Modal>
    );
};
