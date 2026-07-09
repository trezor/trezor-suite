import { useSelector } from 'react-redux';

import {
    type SuiteSyncRelayConnection,
    type SuiteSyncRelayConnectionLogEntry,
    type WithSuiteSyncState,
    selectSuiteSyncRelayConnectionLog,
    selectSuiteSyncRelayConnections,
} from '@suite-common/suite-sync';
import { Box, Card, Code, Column, Icon, Row, Text } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { borders, spacings } from '@trezor/theme';

const MAX_RELAY_CONNECTION_LOG_MESSAGES = 5;

const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const format = (value: number, length = 2) => value.toString().padStart(length, '0');

    return [
        format(date.getHours()),
        format(date.getMinutes()),
        format(date.getSeconds()),
        format(date.getMilliseconds(), 3),
    ].join(':');
};

const RelayConnectionStatusDot = ({ state }: { state: SuiteSyncRelayConnection['state'] }) => (
    <Icon name="circleFilled" intent={state === 'connected' ? 'brand' : 'critical'} size={8} />
);

const getRelayConnectionLogEntryMessage = (entry: SuiteSyncRelayConnectionLogEntry) => {
    if (entry.state !== 'error') return entry.state;

    return entry.errorMessage ? `error (${entry.errorMessage})` : 'error';
};

const getRelayConnectionLog = (entries: SuiteSyncRelayConnectionLogEntry[]) =>
    entries
        .map(
            entry =>
                `${formatTimestamp(entry.timestamp)} ${getRelayConnectionLogEntryMessage(entry)}`,
        )
        .join('\n');

export const SuiteSyncConnectionStatus = () => {
    const relayConnections = useSelector((state: WithSuiteSyncState) =>
        selectSuiteSyncRelayConnections(state),
    );
    const relayConnectionLog = useSelector((state: WithSuiteSyncState) =>
        selectSuiteSyncRelayConnectionLog(state),
    );

    return (
        <SectionItem>
            <TextColumn title="Evolu relay connections" description="Connections" />
            <ActionColumn>
                <Column gap={spacings.xxs}>
                    {relayConnections.length === 0 ? (
                        <Code>[]</Code>
                    ) : (
                        relayConnections.map(connection => {
                            const connectionLog = relayConnectionLog
                                .filter(logEntry => logEntry.url === connection.url)
                                .slice(0, MAX_RELAY_CONNECTION_LOG_MESSAGES);

                            return (
                                <Card
                                    key={connection.url}
                                    paddingType="small"
                                    header={
                                        <Row gap={spacings.xxs} justifyContent="space-between">
                                            <Text typographyStyle="body-sm">
                                                <Code>{connection.url}</Code>
                                            </Text>
                                            <RelayConnectionStatusDot state={connection.state} />
                                        </Row>
                                    }
                                >
                                    {connectionLog.length === 0 ? (
                                        <Code>[]</Code>
                                    ) : (
                                        <Box
                                            as="pre"
                                            margin={{}}
                                            padding={spacings.xs}
                                            backgroundColor="elementFillNeutralSoft"
                                            borderWidth={1}
                                            borderColor="borderNeutral"
                                            borderRadius={borders.radii.xxs}
                                        >
                                            <Text
                                                as="pre"
                                                isMonospaced
                                                typographyStyle="body-sm"
                                                overflowWrap="break-word"
                                                margin={{}}
                                            >
                                                {getRelayConnectionLog(connectionLog)}
                                            </Text>
                                        </Box>
                                    )}
                                </Card>
                            );
                        })
                    )}
                </Column>
            </ActionColumn>
        </SectionItem>
    );
};
