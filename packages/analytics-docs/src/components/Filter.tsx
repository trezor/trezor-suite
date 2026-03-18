import { Icon, Input, Row, Select, useMediaQuery, variables } from '@trezor/components';
import { zIndices } from '@trezor/theme';

import { platforms, sorting } from '../constants';
import type { Sort } from '../types';

const menuPortalTarget = typeof document !== 'undefined' ? document.body : undefined;

type FilterProps = {
    query: string;
    platform: string;
    setQuery: (query: string) => void;
    setPlatform: (query: string) => void;
    setSort: (sort: Sort) => void;
    sort: string;
};

export const Filter = ({ query, setQuery, setPlatform, platform, setSort, sort }: FilterProps) => {
    const isMobile = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.SM})`);

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
