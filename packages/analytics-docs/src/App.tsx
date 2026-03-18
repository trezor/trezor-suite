import type { ReactNode } from 'react';
import {
    startTransition,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import styled from 'styled-components';

import type { SuiteThemeColors } from '@trezor/components';
import {
    Banner,
    Box,
    Button,
    ButtonGroup,
    Column,
    Divider,
    H2,
    H3,
    IconButton,
    Modal,
    ResizableBox,
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
import {
    LIVE_LOG_SIDEBAR_MAX_WIDTH,
    LIVE_LOG_SIDEBAR_MIN_WIDTH,
    LiveLogSidebar,
} from './components/LiveLogSidebar';
import { ResultsInfo } from './components/ResultsInfo';
import { ThemeSwitch } from './components/ThemeSwitch';
import { VersionsSidebar } from './components/VersionsSidebar';
import type { EventDoc } from './types';
import { getEventId, getVersionsWithEvents } from './utils/filterUtils';
import { useFilteredEvents } from './utils/useFilteredEvents';

const SIDEBAR_DEFAULT_WIDTH = 360;

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
    }
`;

export const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
`;

const Page = styled.div`
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;

const MainWithSidebar = styled.div`
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;

    @media (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-direction: column;
    }
`;

const ContentArea = styled.div`
    flex: 1;
    min-width: 0;
    padding: 20px 10px;
    overflow-y: auto;

    @media (max-width: ${variables.SCREEN_SIZE.MD}) {
        order: 1;
    }

    @media (min-width: ${variables.SCREEN_SIZE.MD}) {
        padding: 20px;
    }
`;

const SidebarOuter = styled.div<{ theme: SuiteThemeColors }>`
    margin-left: 8px;

    @media (min-width: ${variables.SCREEN_SIZE.MD}) {
        display: flex;
        flex-direction: column;
        height: 100%;
        z-index: 10;
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
    const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
    const rafRef = useRef<number | null>(null);
    const pendingWidthRef = useRef<number | null>(null);
    const contentScrollRef = useRef<HTMLDivElement | null>(null);

    const setSidebarWidthThrottled = useCallback((w: number) => {
        pendingWidthRef.current = w;
        if (rafRef.current != null) return;
        rafRef.current = requestAnimationFrame(() => {
            if (pendingWidthRef.current != null) {
                setSidebarWidth(pendingWidthRef.current);
                pendingWidthRef.current = null;
            }
            rafRef.current = null;
        });
    }, []);
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
        isLiveLogOpen,
        isSidebarLoading,
        isAnalyticsDataGenerated,
        isAnalyticsDataLoading,
        generatedAt,
        setIsSidebarOpen,
        setIsLiveLogOpen,
        setIsSidebarLoading,
    } = useFilteredEvents();

    const hasActiveFilters = !!query || platform !== 'all' || sort !== 'az';

    const versionsWithEvents = useMemo(
        () => getVersionsWithEvents(filteredEvents),
        [filteredEvents],
    );

    const scrollToIdInContent = useCallback(
        (id: string, opts?: { behavior?: ScrollBehavior; offsetTop?: number }): boolean => {
            const container = contentScrollRef.current;
            const el = document.getElementById(id);
            if (!container || !el) return false;

            const offsetTop = opts?.offsetTop ?? 20;
            const containerRect = container.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const nextTop = elRect.top - containerRect.top + container.scrollTop - offsetTop;
            container.scrollTo({
                top: Math.max(0, nextTop),
                behavior: opts?.behavior ?? 'instant',
            });

            return true;
        },
        [],
    );

    const scrollToEventInContent = useCallback(
        (eventName: string) => {
            scrollToIdInContent(getEventId(eventName), { behavior: 'smooth', offsetTop: 20 });
        },
        [scrollToIdInContent],
    );

    const handleSidebarEventClick = (eventName: string) => {
        const el = document.getElementById(getEventId(eventName));
        if (!el) return;
        el.classList.add('highlighted');
        setTimeout(() => el.classList.remove('highlighted'), HIGHLIGHT_DURATION_MS);
        scrollToEventInContent(eventName);
    };

    const scrollToHashElement = useCallback((): boolean => {
        const container = contentScrollRef.current;
        const hash = window.location.hash.slice(1);
        if (!hash) return true;
        const el = document.getElementById(hash);
        if (!el) return false;

        if (container) {
            if (!scrollToIdInContent(hash, { behavior: 'instant', offsetTop: 20 })) return false;
        } else {
            el.scrollIntoView({ block: 'start', behavior: 'instant' });
        }

        el.classList.add('highlighted');
        setTimeout(() => el.classList.remove('highlighted'), HIGHLIGHT_DURATION_MS);

        return true;
    }, [scrollToIdInContent]);

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
                <Page>
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
                                    <ButtonGroup intent="neutral" priority="secondary" size="small">
                                        <Tooltip
                                            content={
                                                isLiveLogOpen
                                                    ? 'Hide live log'
                                                    : 'Show live analytics log'
                                            }
                                        >
                                            <IconButton
                                                icon="broadcast"
                                                onClick={() => {
                                                    startTransition(() => {
                                                        const next = !isLiveLogOpen;
                                                        setIsLiveLogOpen(next);
                                                        if (next) setIsSidebarOpen(false);
                                                    });
                                                }}
                                                intent={isLiveLogOpen ? 'brand' : 'neutral'}
                                                priority={isLiveLogOpen ? 'primary' : 'secondary'}
                                            />
                                        </Tooltip>
                                        <Tooltip
                                            content={
                                                isSidebarOpen
                                                    ? 'Hide changelog'
                                                    : 'Show versions by changelog'
                                            }
                                        >
                                            <IconButton
                                                icon="clockCounterClockwise"
                                                onClick={() => {
                                                    setIsSidebarLoading(true);
                                                    if (isSidebarOpen) {
                                                        startTransition(() =>
                                                            setIsSidebarOpen(false),
                                                        );
                                                    } else {
                                                        startTransition(() => {
                                                            setIsLiveLogOpen(false);
                                                            setIsSidebarOpen(true);
                                                        });
                                                    }
                                                }}
                                                intent={isSidebarOpen ? 'brand' : 'neutral'}
                                                priority={isSidebarOpen ? 'primary' : 'secondary'}
                                            />
                                        </Tooltip>
                                    </ButtonGroup>
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

                    <MainWithSidebar>
                        <ContentArea ref={contentScrollRef}>
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

                        {(() => {
                            if (!isSidebarOpen && !isLiveLogOpen) return null;

                            const mobileSidebar = isLiveLogOpen ? (
                                <LiveLogSidebar
                                    onEventClick={handleSidebarEventClick}
                                    filterQuery={debouncedQuery}
                                />
                            ) : (
                                <VersionsSidebar
                                    versionsWithEvents={versionsWithEvents}
                                    onEventClick={handleSidebarEventClick}
                                />
                            );

                            const desktopSidebar = (
                                <SidebarOuter>
                                    <ResizableBox
                                        directions={['left']}
                                        width={sidebarWidth}
                                        minWidth={LIVE_LOG_SIDEBAR_MIN_WIDTH}
                                        maxWidth={LIVE_LOG_SIDEBAR_MAX_WIDTH}
                                        minHeight={0}
                                        flex="1"
                                        onWidthResizeEnd={w => {
                                            pendingWidthRef.current = null;
                                            if (rafRef.current != null) {
                                                cancelAnimationFrame(rafRef.current);
                                                rafRef.current = null;
                                            }
                                            setSidebarWidth(w);
                                        }}
                                        onWidthResizeMove={setSidebarWidthThrottled}
                                    >
                                        <Column
                                            overflow="hidden"
                                            minHeight={0}
                                            width="100%"
                                            height="100%"
                                        >
                                            {isLiveLogOpen ? (
                                                <LiveLogSidebar
                                                    onEventClick={handleSidebarEventClick}
                                                    filterQuery={debouncedQuery}
                                                />
                                            ) : (
                                                <VersionsSidebar
                                                    versionsWithEvents={versionsWithEvents}
                                                    onEventClick={handleSidebarEventClick}
                                                />
                                            )}
                                        </Column>
                                    </ResizableBox>
                                </SidebarOuter>
                            );

                            return isMobile ? mobileSidebar : desktopSidebar;
                        })()}
                    </MainWithSidebar>
                </Page>
            </Modal.Provider>
        </>
    );
};
