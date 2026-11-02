import { type AppsEmbeddingEvent } from '@suite-common/apps-embedding';
import { type EmbeddedAppTarget, EmbeddedAppWebView } from '@suite-native/apps-embedding';
import { Box, Button, HStack, Text, VStack } from '@suite-native/atoms';

import { EmbeddedAppWebBrowser } from './EmbeddedAppWebBrowser';
import { EmbeddingEventLog } from './EmbeddingEventLog';
import { type EmbeddingLogEntry, type EmbeddingMode } from '../../hooks/useAppsEmbeddingShowcase';

type EmbeddedAppRegionProps = {
    embedMode: EmbeddingMode;
    target: EmbeddedAppTarget;
    embedTitle: string;
    logEntries: EmbeddingLogEntry[];
    onEvent: (event: AppsEmbeddingEvent) => void;
    onClearEvents: () => void;
    onClose: () => void;
};

export const EmbeddedAppRegion = ({
    embedMode,
    target,
    embedTitle,
    logEntries,
    onEvent,
    onClearEvents,
    onClose,
}: EmbeddedAppRegionProps) => (
    <VStack spacing="sp12" flex={1}>
        <HStack spacing="sp12" justifyContent="space-between" alignItems="center">
            <Box flexShrink={1}>
                <Text variant="body-md-strong" numberOfLines={1}>
                    {embedTitle}
                </Text>
            </Box>
            <Button
                intent="neutral"
                priority="secondary"
                size="small"
                onPress={onClose}
                testID="@dev-utils/apps-embedding/close"
            >
                Close
            </Button>
        </HStack>
        {embedMode === 'webView' ? (
            <EmbeddedAppWebView target={target} onEvent={onEvent} />
        ) : (
            <EmbeddedAppWebBrowser target={target} onEvent={onEvent} />
        )}
        <EmbeddingEventLog entries={logEntries} onClear={onClearEvents} />
    </VStack>
);
