import {
    Box,
    Card,
    Column,
    Icon,
    IconButton,
    Input,
    Popover,
    Row,
    Select,
    Switch,
    Text,
} from '@trezor/components';
import { FunnelIcon, MagnifyingGlassIcon } from '@trezor/icons';
import { zIndices } from '@trezor/theme';

import { platforms, sorting } from '../constants';
import { type SearchField, type Sort, searchFields as allSearchFields } from '../types';

const menuPortalTarget = typeof document !== 'undefined' ? document.body : undefined;

const searchFieldMenuLabel: Record<SearchField, string> = {
    eventName: 'Event name',
    attributeName: 'Attributes',
    trigger: 'Trigger',
    description: 'Description',
};

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
    searchFields: readonly SearchField[];
    setSearchFields: (fields: readonly SearchField[]) => void;
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
    searchFields,
    setSearchFields,
}: FilterProps) => {
    const versionOptions = [
        { value: 'all', label: 'All versions' },
        ...versions.map(v => ({ value: v, label: v })),
    ];

    return (
        <Row gap={8} flex="0 1 auto" minWidth={0} maxWidth="100%">
            <Box flex="0 1 auto" minWidth={0}>
                <Input
                    value={query}
                    size="small"
                    width={240}
                    maxWidth="100%"
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Filter events"
                    showClearButton
                    leftContent={
                        <Icon
                            as={MagnifyingGlassIcon}
                            size={12}
                            intent="neutral"
                            priority="secondary"
                            pointerEvents="none"
                        />
                    }
                    onClear={() => setQuery('')}
                />
            </Box>

            <Popover
                placement={{ position: 'bottom', alignment: 'start' }}
                content={
                    <Card paddingType="small" minWidth={260} overflow="visible">
                        <Column gap={12}>
                            <Text typographyStyle="body-sm-strong">Search in</Text>
                            {allSearchFields.map(field => (
                                <Switch
                                    key={field}
                                    isChecked={searchFields.includes(field)}
                                    isDisabled={
                                        searchFields.length === 1 && searchFields.includes(field)
                                    }
                                    onChange={isChecked => {
                                        const next = isChecked
                                            ? [...searchFields, field]
                                            : searchFields.filter(item => item !== field);

                                        setSearchFields(next);
                                    }}
                                    label={searchFieldMenuLabel[field]}
                                    size="small"
                                />
                            ))}
                            <Select
                                placeholder="Platform"
                                value={platforms.find(p => p.value === platform) ?? platforms[0]}
                                onChange={option => {
                                    setPlatform(option.value);
                                }}
                                aria-label="Platform filter"
                                size="small"
                                options={platforms}
                                menuPosition="absolute"
                            />
                            <Select
                                placeholder="Version"
                                value={
                                    versionOptions.find(v => v.value === version) ??
                                    versionOptions[0]
                                }
                                onChange={option => {
                                    setVersion(option.value);
                                }}
                                aria-label="Version filter"
                                size="small"
                                options={versionOptions}
                                menuPosition="absolute"
                            />
                        </Column>
                    </Card>
                }
            >
                <IconButton
                    icon={FunnelIcon}
                    size="medium"
                    intent="neutral"
                    priority="secondary"
                    tooltip={{ content: 'Filter' }}
                    aria-label="Filter"
                    data-testid="@analytics/filter"
                />
            </Popover>

            <Box flex="0 1 auto" minWidth={0}>
                <Select
                    placeholder="Sort by"
                    width={200}
                    maxWidth="100%"
                    value={sorting.find(s => s.value === sort) ?? sorting[0]}
                    onChange={option => {
                        setSort(option.value);
                    }}
                    size="small"
                    options={sorting}
                    menuPortalTarget={menuPortalTarget}
                    menuPortalZIndex={zIndices.pageHeader}
                />
            </Box>
        </Row>
    );
};
