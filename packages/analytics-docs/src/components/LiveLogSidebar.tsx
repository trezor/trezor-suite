import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { format } from 'date-fns';
import styled from 'styled-components';

import {
    Badge,
    Box,
    CardList,
    Column,
    H3,
    IconButton,
    Input,
    Modal,
    Row,
    Select,
    type SuiteThemeColors,
    Switch,
    TOOLTIP_DELAY_LONG,
    Table,
    Text,
    Tooltip,
    variables,
} from '@trezor/components';
import { zIndices } from '@trezor/theme';

import type { LiveLogEvent } from '../types';
import { fuzzyMatch, getEventId } from '../utils/filterUtils';
import {
    getDefaultLogServerBaseUrl,
    getInitialLogServerBaseUrl,
    setLogServerBaseUrl,
} from '../utils/logServerUrl';
import { useLiveLogEvents } from '../utils/useLiveLogEvents';

const META_KEYS = [
    'version',
    'commit',
    'instanceId',
    'sessionId',
    'messageId',
    'deviceId',
] as const;
const SHOW_META_IN_PAYLOAD_STORAGE_KEY = 'analytics-docs-live-log-show-meta-in-payload';

export const NEW_EVENT_TIMEOUT = 20_000;
export const LIVE_LOG_SIDEBAR_MIN_WIDTH = 280;
export const LIVE_LOG_SIDEBAR_MAX_WIDTH = 800;

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

const NewEventDot = styled.div<{ theme: SuiteThemeColors }>`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ theme }) => theme.backgroundPrimaryDefault};
    flex: 0 0 auto;
`;

const getPayloadEntries = (event: LiveLogEvent): [string, string][] =>
    Object.entries(event.payload ?? {});

const getMetaEntries = (event: LiveLogEvent): [string, string][] =>
    META_KEYS.filter(key => event.meta?.[key] != null).map(key => [key, event.meta[key]!]);

type EventPayloadProps = {
    event: LiveLogEvent;
    isPayloadOpen: boolean;
    showMetaInPayload: boolean;
};

const EventPayload = ({ event, isPayloadOpen, showMetaInPayload }: EventPayloadProps) => {
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

type LiveLogEventItemProps = {
    event: LiveLogEvent;
    onEventClick: (eventName: string) => void;
    isNew: boolean;
    showMetaInPayload: boolean;
};

const LiveLogEventItem = ({
    event,
    onEventClick,
    isNew,
    showMetaInPayload,
}: LiveLogEventItemProps) => {
    const [isPayloadOpen, setIsPayloadOpen] = useState(false);
    const hasPayload =
        getPayloadEntries(event).length > 0 ||
        (showMetaInPayload && getMetaEntries(event).length > 0);

    return (
        <CardList.Item key={event.id} paddingType="small">
            <Column gap={4} margin={{ vertical: 4 }} alignItems="stretch" width="100%">
                <Row
                    onClick={e => {
                        e.stopPropagation();
                        setIsPayloadOpen(prev => !prev);
                    }}
                    justifyContent="space-between"
                    alignItems="center"
                    gap={12}
                >
                    <Column gap={2} flex="1" minWidth={0}>
                        <Text typographyStyle="body-sm-strong">{event.type}</Text>
                        <Row gap={4} minWidth={0}>
                            <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                                {format(new Date(event.receivedAt), 'HH:mm:ss')}
                            </Text>
                            {isNew && <NewEventDot aria-label="New event" />}
                        </Row>
                    </Column>
                    {hasPayload && (
                        <Tooltip content="Find event" delayShow={TOOLTIP_DELAY_LONG}>
                            <IconButton
                                icon="magnifyingGlass"
                                size="small"
                                intent="neutral"
                                priority="secondary"
                                onClick={e => {
                                    onEventClick(event.type);
                                    e.stopPropagation();
                                }}
                            />
                        </Tooltip>
                    )}
                </Row>
                <EventPayload
                    event={event}
                    isPayloadOpen={isPayloadOpen}
                    showMetaInPayload={showMetaInPayload}
                />
            </Column>
        </CardList.Item>
    );
};

type LiveLogSidebarProps = {
    onEventClick: (eventName: string) => void;
    filterQuery: string;
};

export const LiveLogSidebar = ({ onEventClick, filterQuery }: LiveLogSidebarProps) => {
    const [logServerBaseUrl, setLogServerBaseUrlState] = useState(getInitialLogServerBaseUrl);
    const [logServerInput, setLogServerInput] = useState(logServerBaseUrl);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedInstanceId, setSelectedInstanceId] = useState<string>('all');
    const [showMetaInPayload, setShowMetaInPayload] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;

        return window.localStorage.getItem(SHOW_META_IN_PAYLOAD_STORAGE_KEY) === '1';
    });
    const [showMetaInPayloadDraft, setShowMetaInPayloadDraft] = useState(showMetaInPayload);

    const { events, connected, clear } = useLiveLogEvents(logServerBaseUrl);
    const seenEventIdsRef = useRef<Set<string>>(new Set());
    const timeoutsRef = useRef<Map<string, number>>(new Map());
    const [newEventIds, setNewEventIds] = useState<Record<string, true>>({});

    useEffect(() => {
        for (const e of events) {
            if (seenEventIdsRef.current.has(e.id)) continue;
            seenEventIdsRef.current.add(e.id);

            setNewEventIds(prev => (prev[e.id] ? prev : { ...prev, [e.id]: true }));

            const timeoutId = window.setTimeout(() => {
                setNewEventIds(prev => {
                    if (!prev[e.id]) return prev;

                    const { [e.id]: _removed, ...rest } = prev;

                    return rest;
                });
                timeoutsRef.current.delete(e.id);
            }, NEW_EVENT_TIMEOUT);

            timeoutsRef.current.set(e.id, timeoutId);
        }

        return () => {};
    }, [events]);

    useEffect(
        () => () => {
            for (const timeoutId of timeoutsRef.current.values()) {
                window.clearTimeout(timeoutId);
            }
            timeoutsRef.current.clear();
        },
        [],
    );

    const filteredEvents = useMemo(() => {
        const q = filterQuery.trim().toLowerCase();
        const byInstance =
            selectedInstanceId === 'all'
                ? events
                : events.filter(e => (e.meta.instanceId ?? '__unknown__') === selectedInstanceId);

        if (!q) return byInstance;

        return byInstance.filter(e => fuzzyMatch(q, e.type));
    }, [events, filterQuery, selectedInstanceId]);

    const instanceFilterOptions = useMemo(() => {
        const ids = Array.from(
            new Set(events.map(e => e.meta.instanceId ?? '__unknown__').filter(Boolean)),
        ).sort((a, b) => a.localeCompare(b));

        return [
            { value: 'all', label: `All instances (${ids.length})` },
            ...ids.map(id => ({
                value: id,
                label: id === '__unknown__' ? 'Unknown instance' : id,
            })),
        ];
    }, [events]);

    const handleRowClick = (eventName: string) => {
        const id = getEventId(eventName);
        window.location.hash = id;
        onEventClick(eventName);
    };

    return (
        <>
            <SidebarWrapper>
                <Column gap={0}>
                    <Box padding={{ horizontal: 20, top: 20, bottom: 8 }}>
                        <Row justifyContent="space-between" alignItems="center" gap={8}>
                            <H3 margin={{ bottom: 0 }}>Live log</H3>
                            <Row gap={8}>
                                {events.length > 0 && (
                                    <Tooltip content="Clear log">
                                        <IconButton
                                            size="small"
                                            priority="secondary"
                                            intent="critical"
                                            onClick={async () => {
                                                await clear();
                                                seenEventIdsRef.current.clear();
                                                for (const timeoutId of timeoutsRef.current.values()) {
                                                    window.clearTimeout(timeoutId);
                                                }
                                                timeoutsRef.current.clear();
                                                setNewEventIds({});
                                            }}
                                            icon="prohibit"
                                        />
                                    </Tooltip>
                                )}
                                <Tooltip content="Settings">
                                    <IconButton
                                        icon="gear"
                                        size="small"
                                        intent="neutral"
                                        priority="secondary"
                                        onClick={() => setIsSettingsOpen(true)}
                                    />
                                </Tooltip>
                            </Row>
                        </Row>
                        <Box margin={{ bottom: 8 }}>
                            <Badge size="small" intent={connected ? 'brand' : 'warning'}>
                                {connected ? 'Connected' : 'Reconnecting…'}
                            </Badge>
                        </Box>
                        <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                            In Suite, set Custom Analytics URL (Settings → Debug) to{' '}
                            <Text isMonospaced typographyStyle="inherit">
                                {`${logServerBaseUrl.replace(/\/+$/, '')}/log`}
                            </Text>
                        </Text>
                    </Box>

                    <Box padding={{ horizontal: 16, bottom: 16 }}>
                        <Box margin={{ bottom: 12 }}>
                            <Select
                                size="small"
                                value={
                                    instanceFilterOptions.find(
                                        o => o.value === selectedInstanceId,
                                    ) ?? instanceFilterOptions[0]
                                }
                                onChange={option => setSelectedInstanceId(option.value)}
                                options={instanceFilterOptions}
                                menuPortalTarget={
                                    typeof document !== 'undefined' ? document.body : undefined
                                }
                                menuPortalZIndex={zIndices.pageHeader}
                                aria-label="Instance filter"
                            />
                        </Box>
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
                                        isNew={newEventIds[event.id] === true}
                                        showMetaInPayload={showMetaInPayload}
                                        onEventClick={handleRowClick}
                                    />
                                ))}
                            </CardList>
                        )}
                    </Box>
                </Column>
            </SidebarWrapper>
            {isSettingsOpen &&
                createPortal(
                    <Modal
                        heading="Live log settings"
                        onCancel={() => {
                            setIsSettingsOpen(false);
                            setLogServerInput(logServerBaseUrl);
                            setShowMetaInPayloadDraft(showMetaInPayload);
                        }}
                        width={600}
                        bottomContent={
                            <Modal.Button
                                onClick={() => {
                                    const next =
                                        logServerInput.trim() || getDefaultLogServerBaseUrl();
                                    setLogServerBaseUrl(next);
                                    setLogServerBaseUrlState(next);
                                    setLogServerInput(next);
                                    setShowMetaInPayload(showMetaInPayloadDraft);
                                    if (showMetaInPayloadDraft) {
                                        window.localStorage.setItem(
                                            SHOW_META_IN_PAYLOAD_STORAGE_KEY,
                                            '1',
                                        );
                                    } else {
                                        window.localStorage.removeItem(
                                            SHOW_META_IN_PAYLOAD_STORAGE_KEY,
                                        );
                                    }
                                    setIsSettingsOpen(false);
                                }}
                            >
                                Apply
                            </Modal.Button>
                        }
                    >
                        <Column gap={12} alignItems="stretch">
                            <Row gap={8} alignItems="center">
                                <Input
                                    size="small"
                                    value={logServerInput}
                                    onChange={e => setLogServerInput(e.target.value)}
                                    placeholder="Log server base URL (e.g. https://analytics-log.example.com)"
                                    showClearButton
                                    onClear={() => setLogServerInput('')}
                                />

                                <Modal.Button
                                    priority="secondary"
                                    intent="critical"
                                    onClick={() => {
                                        const def = getDefaultLogServerBaseUrl();
                                        setLogServerBaseUrl(def);
                                        setLogServerBaseUrlState(def);
                                        setLogServerInput(def);
                                    }}
                                    size="medium"
                                >
                                    Reset
                                </Modal.Button>
                            </Row>
                            <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                                This controls where analytics-docs connects for live events (SSE)
                                and where Suite should send events to{' '}
                                <Text isMonospaced typographyStyle="inherit">
                                    {`${(logServerInput.trim() || getDefaultLogServerBaseUrl()).replace(/\/+$/, '')}/log`}
                                </Text>
                                .
                            </Text>
                            <Switch
                                isChecked={showMetaInPayloadDraft}
                                onChange={setShowMetaInPayloadDraft}
                                label="Show metadata in payload table"
                            />
                        </Column>
                    </Modal>,
                    document.body,
                )}
        </>
    );
};
