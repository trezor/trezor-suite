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
import { useFilteredEvents } from './utils/useFilteredEvents';

type AppTheme = SuiteThemeColors & { variant: 'light' | 'dark'; mode: 'light' | 'dark' };

type AppProps = { theme: AppTheme };

export const TopBar = styled.div`
    gap: 12px;

    background: ${({ theme }) => hexToRgba(theme.backgroundSurfaceElevation0, 0.8)};
    box-shadow: ${({ theme }) => theme.boxShadowBase};

    padding: 12px 24px;

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
    margin: 20px 10px;

    @media (min-width: ${variables.SCREEN_SIZE.MD}) {
        margin: 140px 20px 20px;
    }
`;

export const ContentContainer = styled.div`
    margin: auto;
    max-width: 1000px;
    width: 100%;
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
    } = useFilteredEvents();

    const hasActiveFilters = !!query || platform !== 'all' || sort !== 'az';

    const eventCards = useMemo(
        () => filteredEvents.map(event => <EventCard key={event.name} event={event} />),
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
                <Content>
                    <ContentContainer>
                        <Column gap={40}>{eventCards}</Column>
                    </ContentContainer>
                </Content>
            </Box>
        </>
    );
};
