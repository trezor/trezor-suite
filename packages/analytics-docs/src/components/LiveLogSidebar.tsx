import { useEffect, useMemo, useRef, useState } from 'react';

import styled from 'styled-components';

import {
    Box,
    CardList,
    Column,
    Select,
    type SuiteThemeColors,
    Text,
    variables,
} from '@trezor/components';
import { zIndices } from '@trezor/theme';

import { fuzzyMatch, getEventId } from '../utils/filterUtils';
import {
    getDefaultLogServerBaseUrl,
    getInitialLogServerBaseUrl,
    setLogServerBaseUrl,
} from '../utils/logServerUrl';
import { useLiveLogEvents } from '../utils/useLiveLogEvents';
import { LiveLogEventItem } from './LiveLog/LiveLogEventItem';
import { LiveLogHeader } from './LiveLog/LiveLogHeader';
import { LiveLogSettings } from './LiveLog/LiveLogSettings';
import {
    LIVE_LOG_SIDEBAR_MAX_WIDTH,
    LIVE_LOG_SIDEBAR_MIN_WIDTH,
    NEW_EVENT_TIMEOUT,
    SHOW_META_IN_PAYLOAD_STORAGE_KEY,
} from './LiveLog/constants';

export { LIVE_LOG_SIDEBAR_MIN_WIDTH, LIVE_LOG_SIDEBAR_MAX_WIDTH };

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
        window.location.hash = getEventId(eventName);
        onEventClick(eventName);
    };

    const handleClearLog = async () => {
        await clear();
        seenEventIdsRef.current.clear();
        for (const timeoutId of timeoutsRef.current.values()) {
            window.clearTimeout(timeoutId);
        }
        timeoutsRef.current.clear();
        setNewEventIds({});
    };

    const handleSettingsApply = () => {
        const next = logServerInput.trim() || getDefaultLogServerBaseUrl();
        setLogServerBaseUrl(next);
        setLogServerBaseUrlState(next);
        setLogServerInput(next);
        setShowMetaInPayload(showMetaInPayloadDraft);
        if (showMetaInPayloadDraft) {
            window.localStorage.setItem(SHOW_META_IN_PAYLOAD_STORAGE_KEY, '1');
        } else {
            window.localStorage.removeItem(SHOW_META_IN_PAYLOAD_STORAGE_KEY);
        }
        setIsSettingsOpen(false);
    };

    const handleSettingsReset = () => {
        const def = getDefaultLogServerBaseUrl();
        setLogServerBaseUrl(def);
        setLogServerBaseUrlState(def);
        setLogServerInput(def);
    };

    const handleSettingsCancel = () => {
        setIsSettingsOpen(false);
        setLogServerInput(logServerBaseUrl);
        setShowMetaInPayloadDraft(showMetaInPayload);
    };

    return (
        <>
            <SidebarWrapper>
                <Column gap={0}>
                    <LiveLogHeader
                        connected={connected}
                        hasEvents={events.length > 0}
                        logServerBaseUrl={logServerBaseUrl}
                        onClear={handleClearLog}
                        onSettingsClick={() => setIsSettingsOpen(true)}
                    />

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
            <LiveLogSettings
                isOpen={isSettingsOpen}
                logServerInput={logServerInput}
                showMetaInPayloadDraft={showMetaInPayloadDraft}
                onLogServerInputChange={setLogServerInput}
                onShowMetaInPayloadChange={setShowMetaInPayloadDraft}
                onCancel={handleSettingsCancel}
                onApply={handleSettingsApply}
                onReset={handleSettingsReset}
            />
        </>
    );
};
