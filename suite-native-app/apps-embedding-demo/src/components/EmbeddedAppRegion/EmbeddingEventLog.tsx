import { useRef } from 'react';
import { ScrollView, type ScrollViewInstance } from 'react-native';

import { formatAppsEmbeddingEvent } from '@suite-common/apps-embedding';
import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type EmbeddingLogEntry } from '../../hooks/useAppsEmbeddingShowcase';

// Lower than desktop's 180 px pane, so an open WebView keeps most of a phone screen.
const eventLogStyle = prepareNativeStyle(() => ({ maxHeight: 120 }));

type EmbeddingEventLogProps = {
    entries: EmbeddingLogEntry[];
    onClear: () => void;
};

export const EmbeddingEventLog = ({ entries, onClear }: EmbeddingEventLogProps) => {
    const { applyStyle } = useNativeStyles();
    const scrollViewRef = useRef<ScrollViewInstance>(null);

    return (
        <VStack spacing="sp8">
            <HStack justifyContent="space-between" alignItems="center">
                <Text variant="body-md-strong">Event log</Text>
                <Button
                    intent="neutral"
                    priority="secondary"
                    size="small"
                    onPress={onClear}
                    testID="@dev-utils/apps-embedding/clear-log"
                >
                    Clear
                </Button>
            </HStack>
            <ScrollView
                ref={scrollViewRef}
                style={applyStyle(eventLogStyle)}
                nestedScrollEnabled
                // The pane is short, so it follows the newest event.
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
            >
                {entries.length === 0 ? (
                    <Text variant="body-sm" color="contentSecondary">
                        No events yet.
                    </Text>
                ) : (
                    entries.map(entry => (
                        <Text key={entry.id} variant="body-xs">
                            [{entry.time}] {formatAppsEmbeddingEvent(entry.event)}
                        </Text>
                    ))
                )}
            </ScrollView>
        </VStack>
    );
};
