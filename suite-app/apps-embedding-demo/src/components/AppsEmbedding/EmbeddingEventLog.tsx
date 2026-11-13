import { formatAppsEmbeddingEvent } from '@suite-common/apps-embedding';
import { Button, Card, Column, Row, Text } from '@trezor/components';

import { type EmbeddingLogEntry } from './hooks/useAppsEmbeddingShowcase';

type EmbeddingEventLogProps = {
    entries: EmbeddingLogEntry[];
    onClear: () => void;
};

export const EmbeddingEventLog = ({ entries, onClear }: EmbeddingEventLogProps) => (
    <Card>
        <Column gap={8}>
            <Row justifyContent="space-between">
                <Text typographyStyle="body-md-strong">Event log</Text>
                <Button size="small" intent="neutral" priority="secondary" onClick={onClear}>
                    Clear
                </Button>
            </Row>
            {entries.length === 0 ? (
                <Text intent="neutral" priority="secondary">
                    No events yet.
                </Text>
            ) : (
                <Column gap={2}>
                    {entries.map(entry => (
                        <Text key={entry.id} typographyStyle="body-sm" isMonospaced>
                            [{entry.time}] {formatAppsEmbeddingEvent(entry.event)}
                        </Text>
                    ))}
                </Column>
            )}
        </Column>
    </Card>
);
