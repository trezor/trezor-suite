import { Card, List, Modal, Paragraph } from '@trezor/components';

type LabelingSwitchToLegacyModalProps = {
    onSwitch: () => void;
    onClose: () => void;
};

// TODO add translations
export const LabelingSwitchToLegacyModal = ({
    onSwitch,
    onClose,
}: LabelingSwitchToLegacyModalProps) => (
    <Modal
        heading="Switch to legacy labeling?"
        onCancel={onClose}
        bottomContent={
            <>
                <Modal.Button onClick={onSwitch}>Switch anyway</Modal.Button>
                <Modal.Button onClick={onClose} variant="tertiary">
                    Cancel
                </Modal.Button>
            </>
        }
    >
        <Card>
            <List>
                <List.Item>
                    <Paragraph>Labels created with secure sync cannot be migrated.</Paragraph>
                </List.Item>
                <List.Item>
                    <Paragraph>
                        With legacy labeling, labels cannot be synced to mobile devices.
                    </Paragraph>
                </List.Item>
            </List>
        </Card>
    </Modal>
);
