import { Input, Row, Select } from '@trezor/components';

import { platforms } from '../constants';

type FilterProps = {
    query: string;
    platform: string;
    setQuery: (query: string) => void;
    setPlatform: (query: string) => void;
};

export const Filter = ({ query, setQuery, setPlatform, platform }: FilterProps) => (
    <Row gap={8}>
        <Input
            value={query}
            size="small"
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter"
            showClearButton="always"
            onClear={() => setQuery('')}
        />

        <Select
            placeholder="Platform"
            value={platform}
            onChange={option => {
                setPlatform(option.value);
            }}
            aria-label="Platform filter"
            size="small"
            options={platforms}
        />
    </Row>
);
