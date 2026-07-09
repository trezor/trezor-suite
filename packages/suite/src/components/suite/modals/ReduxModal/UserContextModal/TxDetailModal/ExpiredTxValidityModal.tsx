import { Translation } from '@suite/intl';
import { Box, Column, IconCircle, Modal, Text } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

type ExpiredTxValidityModalProps = {
    onTryAgain: (cancel: boolean) => void;
    onCancel: () => void;
};

export const ExpiredTxValidityModal = ({ onTryAgain, onCancel }: ExpiredTxValidityModalProps) => (
    <Modal
        width={400}
        bottomContent={
            <>
                <Modal.Button
                    intent="critical"
                    priority="primary"
                    onClick={() => onTryAgain(false)}
                >
                    <Translation id="TR_TRY_AGAIN" />
                </Modal.Button>

                <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                    <Translation id="TR_CLOSE" />
                </Modal.Button>
            </>
        }
    >
        <Column gap={8}>
            <Box margin={{ bottom: 16 }}>
                <IconCircle icon={WarningIcon} size={112} intent="critical" />
            </Box>

            <Text typographyStyle="headline-sm">
                <Translation id="TR_TX_EXPIRED_MODAL_TITLE" />
            </Text>

            <Translation id="TR_TX_EXPIRED_MODAL_DESCRIPTION" />
        </Column>
    </Modal>
);
