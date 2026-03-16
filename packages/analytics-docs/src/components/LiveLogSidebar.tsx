import { useMemo, useState } from 'react';

import styled from 'styled-components';

import {
    Badge,
    Box,
    Button,
    CardList,
    Column,
    H3,
    IconButton,
    Row,
    SuiteThemeColors,
    Table,
    Text,
    variables,
} from '@trezor/components';

import type { LiveLogEvent } from '../types';
import { fuzzyMatch, getEventId } from '../utils/filterUtils';
import { useLiveLogEvents } from '../utils/useLiveLogEvents';

const META_KEYS = ['version', 'commit', 'instanceId', 'sessionId', 'messageId'] as const;

export const LIVE_LOG_SIDEBAR_MIN_WIDTH = 280;
export const LIVE_LOG_SIDEBAR_MAX_WIDTH = 600;

const SidebarWrapper = styled.aside<{ theme: SuiteThemeColors }>`
    width: 100%;
    height: 100%;
    min-height: 0;
    flex-shrink: 0;
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    border-left: 1px solid ${({ theme }) => theme.borderOnElevation1};
    overflow-y: auto;
    display: flex;
    flex-direction: column;

    @media (max-width: ${variables.SCREEN_SIZE.MD}) {
        order: 0;
        border-left: none;
        border-bottom: 1px solid ${({ theme }) => theme.borderOnElevation1};
    }
`;

const StickyHeader = styled.div<{ theme: SuiteThemeColors }>`
    position: sticky;
    top: 0;
    z-index: 2;
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    padding: 12px 0 8px;
`;

const formatTime = (ms: number) => {
    const d = new Date(ms);
    const now = new Date();
    const sameDay =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
    const time = d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    return sameDay
        ? time
        : `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${time}`;
};

const getPayloadEntries = (event: LiveLogEvent): [string, string][] =>
    Object.entries(event.payload ?? {});

const getMetaEntries = (event: LiveLogEvent): [string, string][] =>
    META_KEYS.filter(key => event.meta?.[key] != null).map(key => [key, event.meta[key]!]);

type EventPayloadProps = {
    event: LiveLogEvent;
    isPayloadOpen: boolean;
};

const EventPayload = ({ event, isPayloadOpen }: EventPayloadProps) => {
    const [metaOpen, setMetaOpen] = useState(false);
    const payloadEntries = getPayloadEntries(event);
    const metaEntries = getMetaEntries(event);
    const hasPayload = payloadEntries.length > 0 || metaEntries.length > 0;

    if (!hasPayload || !isPayloadOpen || payloadEntries.length === 0) return null;

    return (
        <Box margin={{ top: 8 }}>
            <>
                <Table typographyStyle="body-xs">
                    <Table.Header>
                        <Table.Row>
                            <Table.Cell>Key</Table.Cell>
                            <Table.Cell>Value</Table.Cell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {payloadEntries.map(([key, value]) => (
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
                {metaEntries.length > 0 && (
                    <Box margin={{ top: 8 }}>
                        <Button
                            size="small"
                            priority="secondary"
                            intent="neutral"
                            onClick={e => {
                                e.stopPropagation();
                                setMetaOpen(prev => !prev);
                            }}
                        >
                            {metaOpen ? 'Hide meta' : 'Show meta'}
                        </Button>
                        {metaOpen && (
                            <Box margin={{ top: 8 }}>
                                <Table typographyStyle="body-xs">
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.Cell>Meta</Table.Cell>
                                            <Table.Cell>Value</Table.Cell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {metaEntries.map(([key, value]) => (
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
                            </Box>
                        )}
                    </Box>
                )}
            </>
        </Box>
    );
};

type LiveLogEventItemProps = {
    event: LiveLogEvent;
    onEventClick: (eventName: string) => void;
};

const LiveLogEventItem = ({ event, onEventClick }: LiveLogEventItemProps) => {
    const [isPayloadOpen, setIsPayloadOpen] = useState(false);
    const hasPayload = getPayloadEntries(event).length > 0 || getMetaEntries(event).length > 0;

    return (
        <CardList.Item key={event.id} paddingType="small">
            <Column gap={4} alignItems="stretch" width="100%">
                <Row
                    onClick={() => onEventClick(event.type)}
                    justifyContent="space-between"
                    alignItems="center"
                    gap={8}
                >
                    <Column gap={0} flex="1" minWidth={0}>
                        <Text typographyStyle="body-xs" isMonospaced>
                            {event.type}
                        </Text>
                        <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                            {formatTime(event.receivedAt)}
                        </Text>
                    </Column>
                    {hasPayload && (
                        <IconButton
                            icon="stack"
                            size="small"
                            intent={isPayloadOpen ? 'brand' : 'neutral'}
                            priority={isPayloadOpen ? 'primary' : 'secondary'}
                            onClick={e => {
                                e.stopPropagation();
                                setIsPayloadOpen(prev => !prev);
                            }}
                        />
                    )}
                </Row>
                <EventPayload event={event} isPayloadOpen={isPayloadOpen} />
            </Column>
        </CardList.Item>
    );
};

type LiveLogSidebarProps = {
    onEventClick: (eventName: string) => void;
    filterQuery: string;
};

export const LiveLogSidebar = ({ onEventClick, filterQuery }: LiveLogSidebarProps) => {
    const { events, connected, clear } = useLiveLogEvents();

    const filteredEvents = useMemo(() => {
        const q = filterQuery.trim().toLowerCase();
        if (!q) return events;

        return events.filter(e => fuzzyMatch(q, e.type));
    }, [events, filterQuery]);

    const handleRowClick = (eventName: string) => {
        const id = getEventId(eventName);
        window.location.hash = id;
        onEventClick(eventName);
    };

    return (
        <SidebarWrapper>
            <Column gap={0}>
                <StickyHeader>
                    <Box padding={{ horizontal: 20, top: 20, bottom: 8 }}>
                        <H3 margin={{ bottom: 8 }}>Live log</H3>
                        <Box margin={{ bottom: 8 }}>
                            <Row gap={8} alignItems="center">
                                <Badge size="small" intent={connected ? 'brand' : 'warning'}>
                                    {connected ? 'Connected' : 'Reconnecting…'}
                                </Badge>
                                {events.length > 0 && (
                                    <Button
                                        size="small"
                                        priority="secondary"
                                        intent="critical"
                                        onClick={clear}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </Row>
                        </Box>
                        <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                            In Suite, set Custom Analytics URL (Settings → Debug) to this origin +
                            /log, e.g.{' '}
                            {typeof window !== 'undefined' ? `${window.location.origin}/log` : '…'}
                        </Text>
                    </Box>
                </StickyHeader>

                <Box padding={{ horizontal: 16, bottom: 16 }}>
                    {events.length === 0 && (
                        <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                            No events yet. Point Suite to this server and trigger analytics.
                        </Text>
                    )}
                    {events.length > 0 && filteredEvents.length === 0 && (
                        <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                            No events match the current filter.
                        </Text>
                    )}
                    {events.length > 0 && filteredEvents.length > 0 && (
                        <CardList margin={{ top: 0 }}>
                            {filteredEvents.map(event => (
                                <LiveLogEventItem
                                    key={event.id}
                                    event={event}
                                    onEventClick={handleRowClick}
                                />
                            ))}
                        </CardList>
                    )}
                </Box>
            </Column>
        </SidebarWrapper>
    );
};
