import { useEffect, useMemo, useState } from 'react';

import styled from 'styled-components';

import {
    Box,
    Column,
    H2,
    Icon,
    Input,
    Paragraph,
    Row,
    Select,
    intermediaryTheme,
} from '@trezor/components';
import { useDebounce } from '@trezor/react-utils';
import { hexToRgba } from '@trezor/utils';

import analyticsData from './analytics.json';
import { EventCard } from './components/EventCard';
import { GlobalStyle } from './components/GlobalStyle';
import type { EventDoc } from './types';
import { getPlatformIcon } from './utils';

const TopBar = styled.div`
    gap: 12px;
    position: sticky;
    top: 0;
    z-index: 100;
    background: ${({ theme }) => hexToRgba(theme.backgroundSurfaceElevation0, 0.8)};
    box-shadow: ${({ theme }) => theme.boxShadowBase};
    backdrop-filter: blur(20px);
    padding: 12px 24px;
`;

const ContentContainer = styled.div`
    margin: auto;
    max-width: 1000px;
    width: 100%;
`;

type AnalyticsJsonShape = {
    events?: Record<string, EventDoc>;
};

const sorting = [
    {
        value: 'az',
        label: 'Alphabetical (A-Z)',
    },
    {
        value: 'za',
        label: 'Alphabetical (Z-A)',
    },
    {
        value: 'added',
        label: 'Added',
    },
    {
        value: 'updated',
        label: 'Last updated',
    },
];

const PlatformItemSelect = ({ platform }: { platform: string }) => (
    <Row alignItems="center" gap={8}>
        <Icon name={getPlatformIcon(platform)} size="medium" />
        {platform}
    </Row>
);

const platforms = [
    {
        value: 'all',
        label: 'All',
    },
    {
        value: 'desktop',
        label: <PlatformItemSelect platform="desktop" />,
    },
    {
        value: 'mobile',
        label: <PlatformItemSelect platform="mobile" />,
    },
    {
        value: 'shared',
        label: <PlatformItemSelect platform="shared" />,
    },
];

function getEventsFromJson(input: unknown): EventDoc[] {
    const data = input as AnalyticsJsonShape;

    if (!data || typeof data !== 'object') return [];
    if (!data.events || typeof data.events !== 'object') return [];

    return Object.values(data.events);
}

function parseVer(v?: string) {
    const [a = 0, b = 0, c = 0] = (v ?? '').split('.').map(n => Number(n) || 0);

    return [a, b, c] as const;
}

function cmpVerDesc(va?: string, vb?: string) {
    const [a1, b1, c1] = parseVer(va);
    const [a2, b2, c2] = parseVer(vb);

    if (a1 !== a2) return a2 - a1;
    if (b1 !== b2) return b2 - b1;
    if (c1 !== c2) return c2 - c1;

    return 0;
}

export function App() {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [platform, setPlatform] = useState<'all' | string>('all');
    const [sort, setSort] = useState<'az' | 'za' | 'added' | 'updated'>('az');
    const debounce = useDebounce();

    const allEvents = useMemo(() => getEventsFromJson(analyticsData), []);

    useEffect(() => {
        debounce(() => setDebouncedQuery(query));
    }, [query, debounce]);

    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    const filteredEvents = useMemo(() => {
        const byPlatformAndQuery = allEvents
            .filter(e => {
                if (platform === 'all') return true;

                return e.platform.includes(platform);
            })
            .filter(e => {
                if (!normalizedQuery) return true;

                const haystack = [e.name ?? '', e.descriptionTrigger ?? ''].join(' ').toLowerCase();

                return haystack.includes(normalizedQuery);
            });

        const getAdded = (e: EventDoc) => e.changelog?.addedInVersion;
        const getEffectiveUpdated = (e: EventDoc) =>
            e.changelog?.lastUpdatedInVersion ?? e.changelog?.addedInVersion;

        return byPlatformAndQuery.sort((a, b) => {
            const an = a.name ?? '';
            const bn = b.name ?? '';

            if (sort === 'az') return an.localeCompare(bn);
            if (sort === 'za') return bn.localeCompare(an);

            if (sort === 'added') {
                const c = cmpVerDesc(getAdded(a), getAdded(b));

                return c !== 0 ? c : an.localeCompare(bn);
            }

            if (sort === 'updated') {
                const c = cmpVerDesc(getEffectiveUpdated(a), getEffectiveUpdated(b));

                return c !== 0 ? c : an.localeCompare(bn);
            }

            return an.localeCompare(bn);
        });
    }, [allEvents, platform, normalizedQuery, sort]);
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
                                <Row gap={8}>
                                    <Input
                                        value={query}
                                        size="small"
                                        onChange={e => setQuery(e.target.value)}
                                        placeholder="Search"
                                        showClearButton="always"
                                        onClear={() => setQuery('')}
                                    />

                                    <Select
                                        placeholder="Platform"
                                        onChange={option => {
                                            setPlatform(option.value);
                                        }}
                                        aria-label="Platform filter"
                                        size="small"
                                        options={platforms}
                                    />
                                </Row>
                            </Row>
                            <Row justifyContent="space-between" gap={16} alignItems="center">
                                <Box width="100%">
                                    <Paragraph typographyStyle="label" variant="tertiary" flex="1">
                                        Showing <strong>{filteredEvents.length}</strong> of{' '}
                                        <strong>{allEvents.length}</strong> events
                                        {platform !== 'all' ? (
                                            <>
                                                {' '}
                                                for platform <strong>{platform}</strong>
                                            </>
                                        ) : null}
                                        {normalizedQuery ? (
                                            <>
                                                {' '}
                                                matching <strong>{debouncedQuery.trim()}</strong>
                                            </>
                                        ) : null}
                                    </Paragraph>
                                </Box>
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
                <Box padding={24}>
                    <ContentContainer>
                        <Column gap={20}>{eventCards}</Column>
                    </ContentContainer>
                </Box>
            </Box>
        </>
    );
}
