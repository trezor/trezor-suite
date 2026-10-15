import { type AppsEmbeddingEvent } from '@suite-common/apps-embedding';
import { Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { type HttpsUrl } from '@trezor/type-utils';

import { EmbeddedAppWebBrowser } from './EmbeddedAppWebBrowser/EmbeddedAppWebBrowser';
import { EmbeddedAppWebView } from './EmbeddedAppWebView/EmbeddedAppWebView';
import { EmbeddingEventLog } from './EmbeddingEventLog';
import { type EmbeddingLogEntry, type EmbeddingMode } from '../../hooks/useAppsEmbeddingShowcase';

type EmbeddedAppRegionProps = {
    embedMode: EmbeddingMode;
    targetUrl: HttpsUrl;
    embedTitle: string;
    logEntries: EmbeddingLogEntry[];
    onEvent: (event: AppsEmbeddingEvent) => void;
    onClearEvents: () => void;
    onClose: () => void;
};

export const EmbeddedAppRegion = ({
    embedMode,
    targetUrl,
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
            <EmbeddedAppWebView key={targetUrl} targetUrl={targetUrl} onEvent={onEvent} />
        ) : (
            <EmbeddedAppWebBrowser targetUrl={targetUrl} onEvent={onEvent} />
        )}
        <EmbeddingEventLog entries={logEntries} onClear={onClearEvents} />
    </VStack>
);
