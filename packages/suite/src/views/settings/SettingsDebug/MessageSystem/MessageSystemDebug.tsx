import { useState } from 'react';

import { selectMessageSystemConfig } from '@suite-common/message-system';
import { Box, Button, ButtonGroup, Paragraph, Row } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { SectionItem } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

import { MessageSystemExperiments } from './MessageSystemExperiment/MessageSystemExperiments';
import { MessageSystemManager } from './MessageSystemManager/MessageSystemManager';

export const MessageSystemDebug = () => {
    const config = useSelector(selectMessageSystemConfig);

    const [isMessageManagerModalOpen, setIsMessageManagerModalOpen] = useState(false);
    const [isExperimentsModalOpen, setIsExperimentsModalOpen] = useState(false);

    const handleCopyConfig = () => {
        if (config === null) return;
        copyToClipboard(JSON.stringify(config, null, 2));
    };
    const toggleOpenMessageManager = (isOpen: boolean) => setIsMessageManagerModalOpen(isOpen);
    const toggleOpenExperiments = (isOpen: boolean) => setIsExperimentsModalOpen(isOpen);

    return (
        <SectionItem data-testid="@settings/debug/message-system">
            <Row justifyContent="space-between" width="100%">
                <Box>
                    <Paragraph>Sequence: {config?.sequence}</Paragraph>
                    <Paragraph>Timestamp: {config?.timestamp}</Paragraph>
                </Box>
                <ButtonGroup size="small">
                    <Button onClick={handleCopyConfig}>Copy full config</Button>
                    <Button
                        onClick={() => toggleOpenMessageManager(true)}
                        data-testid="@settings/debug/message-system/message-manager-button"
                    >
                        Message Manager
                    </Button>
                    <Button onClick={() => toggleOpenExperiments(true)}>Experiments</Button>
                </ButtonGroup>
            </Row>
            {isMessageManagerModalOpen && config?.actions && (
                <MessageSystemManager
                    actions={config.actions}
                    onCloseModal={() => toggleOpenMessageManager(false)}
                />
            )}
            {isExperimentsModalOpen && config?.experiments && (
                <MessageSystemExperiments
                    experiments={config.experiments}
                    onCloseModal={() => toggleOpenExperiments(false)}
                />
            )}
        </SectionItem>
    );
};
