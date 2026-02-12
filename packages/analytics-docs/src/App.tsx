import { useMemo } from 'react';

import styled from 'styled-components';

import {
    Box,
    Button,
    Column,
    H2,
    Row,
    Spinner,
    Tooltip,
    intermediaryTheme,
} from '@trezor/components';
import { hexToRgba } from '@trezor/utils';

import { EventCard } from './components/EventCard';
import { Filter } from './components/Filter';
import { GlobalStyle } from './components/GlobalStyle';
import { ResultsInfo } from './components/ResultsInfo';
import { useFilteredEvents } from './utils/useFilteredEvents';

const TopBar = styled.div`
    gap: 12px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: ${({ theme }) => hexToRgba(theme.backgroundSurfaceElevation0, 0.8)};
    box-shadow: ${({ theme }) => theme.boxShadowBase};
    backdrop-filter: blur(20px);
    padding: 12px 24px;
`;

const Content = styled.div`
    margin: 140px 20px 20px;
`;
const ContentContainer = styled.div`
    margin: auto;
    max-width: 1000px;
    width: 100%;
`;

export function App() {
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
    } = useFilteredEvents();

    const hasActiveFilters = query || platform !== 'all' || sort !== 'az';

    const eventCards = useMemo(
        () => filteredEvents.map(event => <EventCard key={event.name} event={event} />),
        [filteredEvents],
    );

    return (
        <>
            <GlobalStyle theme={{ variant: 'dark', ...intermediaryTheme.dark }} />
            <Box minHeight="100vh">
                <TopBar>
                    <ContentContainer>
                        <Column gap={12}>
                            <Row justifyContent="space-between" gap={20}>
                                <Row gap={40} alignItems="center">
                                    <H2>Analytics events docs</H2>

                                    {isFiltering && <Spinner size={20} />}
                                </Row>
                                <Tooltip content="Add event">
                                    <Button
                                        iconLeft="plus"
                                        intent="neutral"
                                        priority="secondary"
                                        href="https://github.com/trezor/trezor-suite/blob/develop/suite-common/analytics/README.md"
                                        size="small"
                                    >
                                        Add event
                                    </Button>
                                </Tooltip>
                            </Row>
                            <Row justifyContent="space-between" gap={16} alignItems="center">
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
                <Content>
                    <ContentContainer>
                        <Column gap={40}>{eventCards}</Column>
                    </ContentContainer>
                </Content>
            </Box>
        </>
    );
}
