import { useState } from 'react';

import { selectAllValidMessages, selectMessageSystemConfig } from '@suite-common/message-system';
import { Message } from '@suite-common/suite-types';
import { Box, Button, ButtonGroup, Column, Modal, Paragraph, Row } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

const serializeCategory = (category: Message['category']): string =>
    typeof category === 'string' ? category : category.join(', ');

const MessageItemContent = ({ message }: { message: Message }) => {
    if (message.category.includes('feature')) {
        return <pre>{JSON.stringify(message.feature, null, 2)}</pre>;
    }

    return <Paragraph>{message.content.en}</Paragraph>;
};

const MessageItem = ({ message }: { message: Message }) => (
    <div>
        <Paragraph typographyStyle="highlight">
            {message.id} ({serializeCategory(message.category)})
        </Paragraph>
        <MessageItemContent message={message} />
    </div>
);

export const MessageSystemDebugInfo = () => {
    const config = useSelector(selectMessageSystemConfig);
    const allValidMessages = useSelector(selectAllValidMessages);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCopyConfig = () => {
        if (config === null) return;
        copyToClipboard(JSON.stringify(config));
    };
    const handleOpenValidMessages = () => setIsModalOpen(true);
    const handleCloseValidMessages = () => setIsModalOpen(false);

    return (
        <>
            <Row justifyContent="space-between">
                <Box>
                    <Paragraph>Sequence: {config?.sequence}</Paragraph>
                    <Paragraph>Timestamp: {config?.timestamp}</Paragraph>
                </Box>
                <ButtonGroup size="small">
                    <Button onClick={handleCopyConfig}>Copy full config</Button>
                    <Button
                        onClick={handleOpenValidMessages}
                        isDisabled={allValidMessages.length === 0}
                    >
                        See active messages
                    </Button>
                </ButtonGroup>
            </Row>
            {isModalOpen && (
                <Modal onCancel={handleCloseValidMessages}>
                    <Column gap={spacings.sm}>
                        {allValidMessages.map(m => (
                            <MessageItem key={m.id} message={m} />
                        ))}
                    </Column>
                </Modal>
            )}
        </>
    );
};
