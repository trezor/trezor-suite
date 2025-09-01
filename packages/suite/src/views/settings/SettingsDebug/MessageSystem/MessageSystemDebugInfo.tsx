import { useState } from 'react';

import { selectMessageSystemConfig } from '@suite-common/message-system';
import { Box, Button, ButtonGroup, Paragraph, Row } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';

import { SectionItem } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

import { MessageSystemManager } from './MessageSystemManager/MessageSystemManager';

export const MessageSystemDebugInfo = () => {
    const config = useSelector(selectMessageSystemConfig);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCopyConfig = () => {
        if (config === null) return;
        copyToClipboard(JSON.stringify(config, null, 2));
    };
    const handleOpenManageMessages = () => setIsModalOpen(true);
    const handleCloseValidMessages = () => setIsModalOpen(false);

    return (
        <SectionItem data-testid="@settings/debug/message-system/info">
            <Row justifyContent="space-between" width="100%">
                <Box>
                    <Paragraph>Sequence: {config?.sequence}</Paragraph>
                    <Paragraph>Timestamp: {config?.timestamp}</Paragraph>
                </Box>
                <ButtonGroup size="small">
                    <Button onClick={handleCopyConfig}>Copy full config</Button>
                    <Button onClick={handleOpenManageMessages}>Message Manager</Button>
                </ButtonGroup>
            </Row>
            {isModalOpen && config && (
                <MessageSystemManager
                    actions={config.actions}
                    onCloseModal={handleCloseValidMessages}
                />
            )}
        </SectionItem>
    );
};
