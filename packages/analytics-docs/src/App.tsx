import { useMemo } from 'react';

import styled from 'styled-components';

import { Box, Column, H2, Icon, Row, Select, intermediaryTheme } from '@trezor/components';
import { hexToRgba } from '@trezor/utils';

import { EventCard } from './components/EventCard';
import { Filter } from './components/Filter';
import { GlobalStyle } from './components/GlobalStyle';
import { ResultsInfo } from './components/ResultsInfo';
import { sorting } from './constants';
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
    const { filteredEvents, setQuery, setSort, setPlatform, query, platform } = useFilteredEvents();

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
                                <Row gap={16} alignItems="center">
                                    <H2>Analytics events docs</H2>
                                    <Icon name="bookOpen" />
                                </Row>
                                <Filter
                                    setQuery={setQuery}
                                    query={query}
                                    setPlatform={setPlatform}
                                    platform={platform}
                                />
                            </Row>
                            <Row justifyContent="space-between" gap={16} alignItems="center">
                                <ResultsInfo />
                                <Select
                                    placeholder="Sort by"
                                    onChange={option => {
                                        setSort(option.value);
                                    }}
                                    size="small"
                                    options={sorting}
                                    maxWidth={200}
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
