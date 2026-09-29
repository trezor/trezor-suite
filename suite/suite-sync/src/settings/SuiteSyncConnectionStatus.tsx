import { useSelector } from 'react-redux';

import { selectSuiteSyncRelayConnectionStatuses } from '@suite-common/suite-sync';
import { type SuiteSyncRelayConnection } from '@suite-common/suite-sync-types';
import { Code, Column, Row, Text } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { SuiteSyncConnectionStatusDot } from '../SuiteSyncConnectionStatusDot';

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

const getConnectionDetails = ({ openedAt, closedAt, error }: SuiteSyncRelayConnection) => [
    ...(openedAt === null ? [] : [`${formatTimestamp(openedAt)} opened`]),
    ...(closedAt === null ? [] : [`${formatTimestamp(closedAt)} closed`]),
    ...(error === null ? [] : [`${formatTimestamp(error.at)} error (${error.type})`]),
];

type ConnectionDetailsProps = {
    connection: SuiteSyncRelayConnection;
};

const ConnectionDetails = ({ connection }: ConnectionDetailsProps) => {
    const details = getConnectionDetails(connection);

    if (details.length === 0) return null;

    return (
        <Text as="pre" isMonospaced typographyStyle="body-sm" overflowWrap="break-word" margin={{}}>
            {details.join('\n')}
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
                                    <SuiteSyncConnectionStatusDot isConnected={connection.isOpen} />
                                </Row>
                                <ConnectionDetails connection={connection} />
                            </li>
                        ))}
                    </ul>
                </Column>
            </ActionColumn>
        </SectionItem>
    );
};
