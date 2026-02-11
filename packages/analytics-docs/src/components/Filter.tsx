import { Icon, Input, Row, Select } from '@trezor/components';

import { getPlatformIcon } from '../utils/getPlatformIcon';

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

type FilterProps = {
    query: string;
    setQuery: (query: string) => void;
    setPlatform: (query: string) => void;
};

export const Filter = ({ query, setQuery, setPlatform }: FilterProps) => (
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
);
