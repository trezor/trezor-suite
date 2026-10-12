import { useSelector } from 'react-redux';

import {
    type SuiteSyncRelayConnectionLogEntry,
    selectSuiteSyncRelayConnectionStatuses,
} from '@suite-common/suite-sync';
import { Code, Column, Row, Text } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { SuiteSyncConnectionStatusDot } from '../SuiteSyncConnectionStatusDot';

const formatLogEntry = (entry: SuiteSyncRelayConnectionLogEntry) => {
    const date = new Date(entry.timestamp);
    const format = (value: number, length = 2) => value.toString().padStart(length, '0');

    const timestamp = [
        format(date.getHours()),
        format(date.getMinutes()),
        format(date.getSeconds()),
        format(date.getMilliseconds(), 3),
    ].join(':');
    let message: string = entry.state;

    if (entry.state === 'error' && entry.errorMessage) {
        message = `error (${entry.errorMessage})`;
    }

    return `${timestamp} ${message}`;
};
type LogProps = { entries: SuiteSyncRelayConnectionLogEntry[] };

const Log = ({ entries }: LogProps) => {
    if (entries.length === 0) return null;

    return (
        <Text as="pre" isMonospaced typographyStyle="body-sm" overflowWrap="break-word" margin={{}}>
            {entries.map(formatLogEntry).join('\n')}
        </Text>
    );
};

export const SuiteSyncConnectionStatus = () => {
    const relayConnectionStatuses = useSelector(selectSuiteSyncRelayConnectionStatuses);

    return (
        <SectionItem>
            <TextColumn title="Evolu relay connections" />
            <ActionColumn>
                <Column gap={4}>
                    <ul>
                        {relayConnectionStatuses.map(connection => (
                            <li key={connection.url}>
                                <Row gap={4} justifyContent="space-between">
                                    <Text typographyStyle="body-sm">
                                        <Code>{connection.url}</Code>
                                    </Text>
                                    <SuiteSyncConnectionStatusDot
                                        isConnected={connection.state === 'connected'}
                                    />
                                </Row>
                                <Log entries={connection.log} />
                            </li>
                        ))}
                    </ul>
                </Column>
            </ActionColumn>
        </SectionItem>
    );
};
