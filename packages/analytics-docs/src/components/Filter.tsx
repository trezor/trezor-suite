import { Input, Row, Select } from '@trezor/components';

import { platforms, sorting } from '../constants';

type FilterProps = {
    query: string;
    platform: string;
    setQuery: (query: string) => void;
    setPlatform: (query: string) => void;
    setSort: (sort: string) => void;
    sort: string;
};

export const Filter = ({ query, setQuery, setPlatform, platform, setSort, sort }: FilterProps) => (
    <Row gap={8}>
        <Input
            value={query}
            size="small"
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter events"
            showClearButton="always"
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
        />
        <Select
            placeholder="Sort by"
            value={sorting.find(s => s.value === sort) ?? sorting[0]}
            onChange={option => {
                setSort(option.value);
            }}
            size="small"
            options={sorting}
            maxWidth={200}
        />
    </Row>
);
