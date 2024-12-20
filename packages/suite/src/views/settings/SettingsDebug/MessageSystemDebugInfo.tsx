import { useState } from 'react';

import { Box, Button, ButtonGroup, Column, NewModal, Paragraph, Row } from '@trezor/components';
import { selectAllValidMessages, selectMessageSystemConfig } from '@suite-common/message-system';
import { copyToClipboard } from '@trezor/dom-utils';
import { Message } from '@suite-common/suite-types';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

const serializeCategory = (category: Message['category']): string =>
    typeof category === 'string' ? category : category.join(', ');

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
                <NewModal onCancel={handleCloseValidMessages}>
                    <Column gap={spacings.sm}>
                        {allValidMessages.map(m => (
                            <div key={m.id}>
                                <Paragraph typographyStyle="highlight">
                                    {m.id} ({serializeCategory(m.category)})
                                </Paragraph>
                                <Paragraph>{m.content.en}</Paragraph>
                            </div>
                        ))}
                    </Column>
                </NewModal>
            )}
        </>
    );
};
