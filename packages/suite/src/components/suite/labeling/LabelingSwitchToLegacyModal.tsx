import { Translation } from '@suite/intl';
import { Card, Icon, List, Modal, Paragraph } from '@trezor/components';

type LabelingSwitchToLegacyModalProps = {
    onSwitch: () => void;
    onClose: () => void;
};

export const LabelingSwitchToLegacyModal = ({
    onSwitch,
    onClose,
}: LabelingSwitchToLegacyModalProps) => (
    <Modal
        heading={<Translation id="TR_SWITCH_TO_LEGACY_LABELING_MODAL_HEADING" />}
        onCancel={onClose}
        bottomContent={
            <>
                <Modal.Button onClick={onSwitch}>
                    <Translation id="TR_SWITCH_ANYWAY" />
                </Modal.Button>
                <Modal.Button onClick={onClose} intent="neutral" priority="secondary">
                    <Translation id="TR_CANCEL" />
                </Modal.Button>
            </>
        }
    >
        <Card paddingType="large">
            <List gap={16} intent="neutral" priority="secondary">
                <List.Item bulletComponent={<Icon name="tag" size={20} />}>
                    <Paragraph>
                        <Translation id="TR_SECURE_SYNC_LABELS_CANNOT_BE_MIGRATED" />
                    </Paragraph>
                </List.Item>
                <List.Item bulletComponent={<Icon name="deviceMobile" size={20} />}>
                    <Paragraph>
                        <Translation id="TR_LEGACY_LABELS_CANNOT_BE_SYNCED_TO_MOBILE" />
                    </Paragraph>
                </List.Item>
            </List>
        </Card>
    </Modal>
);
