import type { ReactNode } from 'react';
import { startTransition, useMemo } from 'react';

import styled from 'styled-components';

import type { SuiteThemeColors } from '@trezor/components';
import {
    Box,
    Button,
    Column,
    H2,
    H3,
    IconButton,
    Paragraph,
    Row,
    Spinner,
    Tooltip,
    useMediaQuery,
    variables,
} from '@trezor/components';
import { hexToRgba } from '@trezor/utils';

import { EventCard } from './components/EventCard';
import { Filter } from './components/Filter';
import { GlobalStyle } from './components/GlobalStyle';
import { ResultsInfo } from './components/ResultsInfo';
import { ThemeSwitch } from './components/ThemeSwitch';
import { SIDEBAR_WIDTH, VersionsSidebar } from './components/VersionsSidebar';
import { HEADER_HEIGHT } from './constants';
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
        z-index: 100;
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

type AnalyticsContentProps = {
    isAnalyticsDataLoading: boolean;
    isAnalyticsDataGenerated: boolean;
    eventCards: ReactNode;
};

const AnalyticsContent = ({
    isAnalyticsDataLoading,
    isAnalyticsDataGenerated,
    eventCards,
}: AnalyticsContentProps) => {
    if (isAnalyticsDataLoading) return <Spinner size={20} />;
    if (!isAnalyticsDataGenerated) {
        return (
            <Paragraph typographyStyle="callout" intent="warning">
                analytics.json has not been generated. Run <code>yarn build-data</code> (or{' '}
                <code>yarn dev</code>) to generate it.
            </Paragraph>
        );
    }

    return <Column gap={40}>{eventCards}</Column>;
};

export const App = ({ theme }: AppProps) => {
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

    const eventCards = useMemo(
        () =>
            filteredEvents.map(event => (
                <EventCardWrapper key={event.name} id={getEventId(event.name)}>
                    <EventCard event={event} />
                </EventCardWrapper>
            )),
        [filteredEvents],
    );
    const isMobile = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.MD})`);

    const Heading = isMobile ? H3 : H2;

    const addButtonProps = {
        intent: 'neutral' as const,
        priority: 'secondary' as const,
        href: 'https://github.com/trezor/trezor-suite/blob/develop/suite-common/analytics/README.md',
        size: 'small' as const,
    };

    return (
        <>
            <GlobalStyle theme={theme} />
            <Box minHeight="100vh">
                <TopBar>
                    <ContentContainer>
                        <Row justifyContent="space-between" gap={20} alignItems="center" flex="1">
                            <Row gap={12} alignItems="center">
                                <Heading>Analytics events docs</Heading>
                                {(isFiltering || isSidebarLoading) && <Spinner size={20} />}
                            </Row>
                            <Row gap={8} alignItems="center">
                                <ThemeSwitch />
                                <Tooltip content="Add event">
                                    {isMobile ? (
                                        <IconButton icon="plus" {...addButtonProps} />
                                    ) : (
                                        <Button iconLeft="plus" {...addButtonProps}>
                                            Add event
                                        </Button>
                                    )}
                                </Tooltip>
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
                            />
                        </ContentContainer>
                    </Content>
                )}
            </Box>
        </>
    );
};
