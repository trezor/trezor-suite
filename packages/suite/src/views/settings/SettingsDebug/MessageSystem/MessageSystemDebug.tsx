import { useState } from 'react';

import { selectMessageSystemConfig } from '@suite-common/message-system';
import { Box, NewButton, NewButtonGroup, Paragraph, Row } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';

import { SectionItem } from 'src/components/suite';
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
                <NewButtonGroup size="small">
                    <NewButton onClick={handleCopyConfig}>Copy full config</NewButton>
                    <NewButton onClick={() => toggleOpenMessageManager(true)}>
                        Message Manager
                    </NewButton>
                    <NewButton onClick={() => toggleOpenExperiments(true)}>Experiments</NewButton>
                </NewButtonGroup>
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
