import type { ReactNode } from 'react';
import { startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';

import styled from 'styled-components';

import type { SuiteThemeColors } from '@trezor/components';
import {
    Banner,
    Box,
    Button,
    Column,
    Divider,
    H2,
    H3,
    IconButton,
    Modal,
    Row,
    Spinner,
    Text,
    Tooltip,
    useMediaQuery,
    variables,
} from '@trezor/components';
import { hexToRgba } from '@trezor/utils';

import { AddEventModal } from './components/AddEventModal';
import { EventCard } from './components/EventCard';
import { Filter } from './components/Filter';
import { GlobalStyle } from './components/GlobalStyle';
import { ResultsInfo } from './components/ResultsInfo';
import { ThemeSwitch } from './components/ThemeSwitch';
import { SIDEBAR_WIDTH, VersionsSidebar } from './components/VersionsSidebar';
import { HEADER_HEIGHT } from './constants';
import type { EventDoc } from './types';
import { getEventId, getVersionsWithEvents } from './utils/filterUtils';
import { useFilteredEvents } from './utils/useFilteredEvents';

type AppTheme = SuiteThemeColors & { variant: 'light' | 'dark'; mode: 'light' | 'dark' };

type AppProps = { theme: AppTheme };

export const TopBar = styled.div`
    display: flex;
    align-items: center;
    padding: 12px 24px;
    background: ${({ theme }) => hexToRgba(theme.backgroundSurfaceElevation0, 0.8)};
    box-shadow: ${({ theme }) => theme.boxShadowBase};

    @media (min-width: ${variables.SCREEN_SIZE.MD}) {
        backdrop-filter: blur(20px);
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 50; /* below theme tooltip (60) so tooltips are visible above header */
    }
`;

export const Content = styled.div`
    padding: 20px 10px;

    @media (min-width: ${variables.SCREEN_SIZE.MD}) {
        margin: ${HEADER_HEIGHT}px 20px 0;
    }
`;

export const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
`;

const MainWithSidebar = styled.div`
    display: flex;
    flex: 1;
    min-height: 0;

    @media (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-direction: column;
    }

    @media (min-width: ${variables.SCREEN_SIZE.MD}) {
        margin: ${HEADER_HEIGHT}px 0 0;
    }
`;

const ContentArea = styled.div`
    flex: 1;
    min-width: 0;
    margin: 0;
    padding: 20px 10px;

    @media (max-width: ${variables.SCREEN_SIZE.MD}) {
        order: 1;
    }

    @media (min-width: ${variables.SCREEN_SIZE.MD}) {
        margin: 0 20px 20px;
        margin-right: ${SIDEBAR_WIDTH + 20}px;
    }
`;

const HIGHLIGHT_DURATION_MS = 1000;

const EventCardWrapper = styled.div`
    border-radius: 18px;
    border: 2px solid transparent;
    transition: border-color 0.4s ease-out;

    &.highlighted {
        border-color: ${({ theme }) => theme.backgroundAlertYellowBold};
    }
`;

const ScrollWhenReady = ({ onReady }: { onReady: () => void }) => {
    useLayoutEffect(() => {
        onReady();
    }, [onReady]);

    return null;
};

const formatGeneratedAt = (isoString: string): string => {
    const d = new Date(isoString);
    const YYYY = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const DD = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');

    return `${YYYY}-${MM}-${DD}, ${HH}:${mm}`;
};

type AnalyticsContentProps = {
    isAnalyticsDataLoading: boolean;
    isAnalyticsDataGenerated: boolean;
    eventCards: ReactNode;
    hasEventCards: boolean;
    generatedAt?: string;
    onContentReady?: () => void;
};

const AnalyticsContent = ({
    isAnalyticsDataLoading,
    isAnalyticsDataGenerated,
    eventCards,
    hasEventCards,
    generatedAt,
    onContentReady,
}: AnalyticsContentProps) => {
    if (isAnalyticsDataLoading) return <Spinner size={20} />;
    if (!isAnalyticsDataGenerated) {
        return (
            <Banner
                intent="warning"
                icon
                description={
                    <>
                        File{' '}
                        <Text isMonospaced typographyStyle="inherit">
                            analytics.json
                        </Text>{' '}
                        has not been generated. Run{' '}
                        <Text isMonospaced typographyStyle="inherit">
                            yarn build-data
                        </Text>{' '}
                        (or{' '}
                        <Text isMonospaced typographyStyle="inherit">
                            yarn dev
                        </Text>
                        ) to generate it.
                    </>
                }
            />
        );
    }

    return (
        <Column gap={40}>
            {eventCards}
            {onContentReady && hasEventCards && <ScrollWhenReady onReady={onContentReady} />}
            {generatedAt && (
                <Box>
                    <Divider margin={{ top: 0, bottom: 12 }} />
                    <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                        Docs generated at {formatGeneratedAt(generatedAt)}
                    </Text>
                </Box>
            )}
        </Column>
    );
};

export const App = ({ theme }: AppProps) => {
    const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<EventDoc | null>(null);
    const {
        filteredEvents,
        setQuery,
        setSort,
        setPlatform,
        clearAll,
        query,
        platform,
        sort,
        debouncedQuery,
        allEvents,
        isFiltering,
        isSidebarOpen,
        isSidebarLoading,
        isAnalyticsDataGenerated,
        isAnalyticsDataLoading,
        generatedAt,
        setIsSidebarOpen,
        setIsSidebarLoading,
    } = useFilteredEvents();

    const hasActiveFilters = !!query || platform !== 'all' || sort !== 'az';

    const versionsWithEvents = useMemo(
        () => getVersionsWithEvents(filteredEvents),
        [filteredEvents],
    );

    const handleSidebarEventClick = (eventName: string) => {
        const el = document.getElementById(getEventId(eventName));
        if (!el) return;
        el.classList.add('highlighted');
        setTimeout(() => el.classList.remove('highlighted'), HIGHLIGHT_DURATION_MS);
    };

    const scrollToHashElement = useCallback((): boolean => {
        const hash = window.location.hash.slice(1);
        if (!hash) return true;
        const el = document.getElementById(hash);
        if (!el) return false;
        el.scrollIntoView({ block: 'start', behavior: 'instant' });
        window.scrollBy(0, -(HEADER_HEIGHT + 20));
        el.classList.add('highlighted');
        setTimeout(() => el.classList.remove('highlighted'), HIGHLIGHT_DURATION_MS);

        return true;
    }, []);

    const handleContentReady = useCallback(() => {
        if (!window.location.hash) return;
        let attempts = 0;
        const maxAttempts = 20;
        const tryScroll = () => {
            if (scrollToHashElement()) return;
            attempts += 1;
            if (attempts < maxAttempts) {
                setTimeout(tryScroll, 80);
            }
        };
        requestAnimationFrame(() => {
            requestAnimationFrame(tryScroll);
        });
    }, [scrollToHashElement]);

    useEffect(() => {
        const onHashChange = () => scrollToHashElement();
        window.addEventListener('hashchange', onHashChange);

        return () => window.removeEventListener('hashchange', onHashChange);
    }, [scrollToHashElement]);

    const handleEditEvent = useCallback((event: EventDoc) => {
        setEventToEdit(event);
        setIsAddEventModalOpen(true);
    }, []);

    const eventCards = useMemo(
        () =>
            filteredEvents.map(event => (
                <EventCardWrapper key={event.name} id={getEventId(event.name)}>
                    <EventCard event={event} onEdit={handleEditEvent} />
                </EventCardWrapper>
            )),
        [filteredEvents, handleEditEvent],
    );
    const isMobile = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.MD})`);

    const Heading = isMobile ? H3 : H2;

    const addButtonProps = {
        intent: 'neutral' as const,
        priority: 'secondary' as const,
        size: 'small' as const,
        onClick: () => setIsAddEventModalOpen(true),
    };

    return (
        <>
            <GlobalStyle theme={theme} />
            <Modal.Provider>
                <AddEventModal
                    isOpen={isAddEventModalOpen}
                    onClose={() => {
                        setIsAddEventModalOpen(false);
                        setEventToEdit(null);
                    }}
                    initialEvent={eventToEdit}
                />
                <Box minHeight="100vh">
                    <TopBar>
                        <ContentContainer>
                            <Row
                                justifyContent="space-between"
                                gap={20}
                                alignItems="center"
                                flex="1"
                            >
                                <Row gap={12} alignItems="center">
                                    <Heading>Analytics events docs</Heading>
                                    {(isFiltering || isSidebarLoading) && <Spinner size={20} />}
                                </Row>
                                <Row gap={8} alignItems="center">
                                    <Tooltip isActive={isMobile} content="Add event">
                                        {isMobile ? (
                                            <IconButton icon="plus" {...addButtonProps} />
                                        ) : (
                                            <Button iconLeft="plus" {...addButtonProps}>
                                                Add event
                                            </Button>
                                        )}
                                    </Tooltip>
                                    <ThemeSwitch />
                                    <Tooltip
                                        content={
                                            isSidebarOpen
                                                ? 'Hide versions'
                                                : 'Show versions by changelog'
                                        }
                                    >
                                        <IconButton
                                            icon="clockCounterClockwise"
                                            onClick={() => {
                                                setIsSidebarLoading(true);
                                                if (isSidebarOpen) {
                                                    startTransition(() => setIsSidebarOpen(false));
                                                } else {
                                                    requestAnimationFrame(() => {
                                                        requestAnimationFrame(() => {
                                                            startTransition(() =>
                                                                setIsSidebarOpen(true),
                                                            );
                                                        });
                                                    });
                                                }
                                            }}
                                            intent={isSidebarOpen ? 'brand' : 'neutral'}
                                            size="small"
                                            priority={isSidebarOpen ? 'primary' : 'secondary'}
                                        />
                                    </Tooltip>
                                </Row>
                            </Row>
                            <Row
                                justifyContent="space-between"
                                gap={16}
                                alignItems="center"
                                flexWrap={isMobile ? 'wrap-reverse' : undefined}
                            >
                                <ResultsInfo
                                    filteredCount={filteredEvents.length}
                                    totalCount={allEvents.length}
                                    platform={platform}
                                    query={debouncedQuery}
                                    hasActiveFilters={hasActiveFilters}
                                    onClearAll={clearAll}
                                />
                                <Filter
                                    setQuery={setQuery}
                                    query={query}
                                    setPlatform={setPlatform}
                                    platform={platform}
                                    setSort={setSort}
                                    sort={sort}
                                />
                            </Row>
                        </ContentContainer>
                    </TopBar>

                    {isSidebarOpen ? (
                        <MainWithSidebar>
                            <ContentArea>
                                <ContentContainer>
                                    <AnalyticsContent
                                        isAnalyticsDataLoading={isAnalyticsDataLoading}
                                        isAnalyticsDataGenerated={isAnalyticsDataGenerated}
                                        eventCards={eventCards}
                                        hasEventCards={filteredEvents.length > 0}
                                        generatedAt={generatedAt}
                                        onContentReady={handleContentReady}
                                    />
                                </ContentContainer>
                            </ContentArea>
                            <VersionsSidebar
                                versionsWithEvents={versionsWithEvents}
                                onEventClick={handleSidebarEventClick}
                            />
                        </MainWithSidebar>
                    ) : (
                        <Content>
                            <ContentContainer>
                                <AnalyticsContent
                                    isAnalyticsDataLoading={isAnalyticsDataLoading}
                                    isAnalyticsDataGenerated={isAnalyticsDataGenerated}
                                    eventCards={eventCards}
                                    hasEventCards={filteredEvents.length > 0}
                                    generatedAt={generatedAt}
                                    onContentReady={handleContentReady}
                                />
                            </ContentContainer>
                        </Content>
                    )}
                </Box>
            </Modal.Provider>
        </>
    );
};
