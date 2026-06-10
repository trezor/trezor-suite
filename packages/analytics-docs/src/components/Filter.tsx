import { Icon, IconButton, Input, Row, Select, useMediaQuery, variables } from '@trezor/components';
import { zIndices } from '@trezor/theme';

import { platforms, sorting } from '../constants';
import type { SearchMode, Sort } from '../types';

const menuPortalTarget = typeof document !== 'undefined' ? document.body : undefined;

type FilterProps = {
    query: string;
    platform: string;
    setQuery: (query: string) => void;
    setPlatform: (query: string) => void;
    setSort: (sort: Sort) => void;
    sort: string;
    version: string;
    setVersion: (version: string) => void;
    versions: string[];
    searchMode: SearchMode;
    setSearchMode: (mode: SearchMode) => void;
};

export const Filter = ({
    query,
    setQuery,
    setPlatform,
    platform,
    setSort,
    sort,
    version,
    setVersion,
    versions,
    searchMode,
    setSearchMode,
}: FilterProps) => {
    const isMobile = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.SM})`);

    const versionOptions = [
        { value: 'all', label: 'All versions' },
        ...versions.map(v => ({ value: v, label: v })),
    ];

    const isFullText = searchMode === 'fulltext';

    return (
        <Row gap={8} flexWrap={isMobile ? 'wrap' : undefined}>
            <Input
                value={query}
                size="small"
                onChange={e => setQuery(e.target.value)}
                placeholder="Filter events"
                showClearButton
                leftContent={
                    <Icon
                        name="magnifyingGlass"
                        size={12}
                        intent="neutral"
                        priority="secondary"
                        pointerEvents="none"
                    />
                }
                rightContent={
                    isFullText ? (
                        <IconButton
                            icon="fileText"
                            size="small"
                            intent="neutral"
                            priority="primary"
                            onClick={() => setSearchMode('name')}
                            aria-label="Toggle full-text search"
                            tooltip={{
                                content:
                                    'Full-text search is ON — matching event name, trigger, descriptions, attributes and types. Click to search event titles only.',
                            }}
                        />
                    ) : (
                        <IconButton
                            icon="fileText"
                            size="small"
                            intent="neutral"
                            priority="secondary"
                            onClick={() => setSearchMode('fulltext')}
                            aria-label="Toggle full-text search"
                            tooltip={{
                                content:
                                    'Full-text search is OFF — searching event titles only. Click to search everything (trigger, descriptions, attributes and types).',
                            }}
                        />
                    )
                }
                onClear={() => setQuery('')}
            />

            <Select
                placeholder="Platform"
                value={platforms.find(p => p.value === platform) ?? platforms[0]}
                onChange={option => {
                    setPlatform(option.value);
                }}
                aria-label="Platform filter"
                size="small"
                options={platforms}
                menuPortalTarget={menuPortalTarget}
                menuPortalZIndex={zIndices.pageHeader}
            />
            <Select
                placeholder="Version"
                value={versionOptions.find(v => v.value === version) ?? versionOptions[0]}
                onChange={option => {
                    setVersion(option.value);
                }}
                aria-label="Version filter"
                size="small"
                options={versionOptions}
                menuPortalTarget={menuPortalTarget}
                menuPortalZIndex={zIndices.pageHeader}
            />
            <Select
                placeholder="Sort by"
                value={sorting.find(s => s.value === sort) ?? sorting[0]}
                onChange={option => {
                    setSort(option.value);
                }}
                size="small"
                options={sorting}
                menuPortalTarget={menuPortalTarget}
                menuPortalZIndex={zIndices.pageHeader}
            />
        </Row>
    );
};
