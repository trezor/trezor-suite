import { useMemo } from 'react';

import styled from 'styled-components';

import {
    Box,
    Button,
    Column,
    H2,
    H3,
    IconButton,
    Row,
    Spinner,
    Tooltip,
    useMediaQuery,
    variables,
} from '@trezor/components';
import type { SuiteThemeColors } from '@trezor/components';
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
        margin: ${HEADER_HEIGHT}px 20px 0px;
    }
`;

export const ContentContainer = styled.div`
    margin: auto;
    max-width: 1000px;
    width: 100%;
`;

const MainWithSidebar = styled.div`
    display: flex;
    flex: 1;
    min-height: 0;

    @media (min-width: ${variables.SCREEN_SIZE.MD}) {
        margin: ${HEADER_HEIGHT}px 0 0px;
    }
`;

const ContentArea = styled.div`
    flex: 1;
    min-width: 0;
    margin: 0;
    padding: 20px 10px;

    @media (min-width: ${variables.SCREEN_SIZE.MD}) {
        margin: 0 20px 20px 0;
        margin-left: ${SIDEBAR_WIDTH + 20}px;
    }
`;

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
        setIsSidebarOpen,
    } = useFilteredEvents();

    const hasActiveFilters = !!query || platform !== 'all' || sort !== 'az';

    const versionsWithEvents = useMemo(
        () => getVersionsWithEvents(filteredEvents),
        [filteredEvents],
    );

    const eventCards = useMemo(
        () =>
            filteredEvents.map(event => (
                <div key={event.name} id={getEventId(event.name)}>
                    <EventCard event={event} />
                </div>
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
                        <Column gap={12}>
                            <Row justifyContent="space-between" gap={20}>
                                <Row gap={40} alignItems="center">
                                    <Heading>Analytics events docs</Heading>

                                    {isFiltering && <Spinner size={20} />}
                                </Row>
                                <Row gap={8} alignItems="center">
                                    <Tooltip
                                        content={
                                            isSidebarOpen
                                                ? 'Hide versions'
                                                : 'Show versions by last updated'
                                        }
                                    >
                                        <IconButton
                                            icon="sidebar"
                                            onClick={() => setIsSidebarOpen(prev => !prev)}
                                            intent={isSidebarOpen ? 'brand' : 'neutral'}
                                            size="small"
                                            priority={isSidebarOpen ? 'primary' : 'secondary'}
                                        />
                                    </Tooltip>
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
                        </Column>
                    </ContentContainer>
                </TopBar>
                {isSidebarOpen ? (
                    <MainWithSidebar>
                        <VersionsSidebar versionsWithEvents={versionsWithEvents} />
                        <ContentArea>
                            <ContentContainer>
                                <Column gap={40}>{eventCards}</Column>
                            </ContentContainer>
                        </ContentArea>
                    </MainWithSidebar>
                ) : (
                    <Content>
                        <ContentContainer>
                            <Column gap={40}>{eventCards}</Column>
                        </ContentContainer>
                    </Content>
                )}
            </Box>
        </>
    );
};
