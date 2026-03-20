import { Box, Table, Text } from '@trezor/components';

import { META_KEYS } from './constants';
import type { LiveLogEvent } from '../../types';

const getPayloadEntries = (event: LiveLogEvent): [string, string][] =>
    Object.entries(event.payload ?? {});

const getMetaEntries = (event: LiveLogEvent): [string, string][] =>
    META_KEYS.filter(key => event.meta?.[key] != null).map(key => [key, event.meta[key]!]);

type EventPayloadProps = {
    event: LiveLogEvent;
    isPayloadOpen: boolean;
    showMetaInPayload: boolean;
};

export const EventPayload = ({ event, isPayloadOpen, showMetaInPayload }: EventPayloadProps) => {
    const payloadEntries = getPayloadEntries(event);
    const metaEntries = getMetaEntries(event);
    const tableEntries = showMetaInPayload ? [...payloadEntries, ...metaEntries] : payloadEntries;
    const hasPayload = tableEntries.length > 0;

    if (!hasPayload || !isPayloadOpen) return null;

    return (
        <Box margin={{ top: 8 }} cursor="auto">
            <>
                <Table typographyStyle="body-xs">
                    <Table.Header>
                        <Table.Row>
                            <Table.Cell>Key</Table.Cell>
                            <Table.Cell>Value</Table.Cell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {tableEntries.map(([key, value]) => (
                            <Table.Row key={key}>
                                <Table.Cell>
                                    <Text isMonospaced>{key}</Text>
                                </Table.Cell>
                                <Table.Cell>
                                    <Text isMonospaced>{String(value)}</Text>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </>
        </Box>
    );
};

export const hasEventPayload = (event: LiveLogEvent, showMetaInPayload: boolean): boolean =>
    getPayloadEntries(event).length > 0 || (showMetaInPayload && getMetaEntries(event).length > 0);
