import type { NetworkSymbol } from '@suite-common/wallet-config';
import { Icon, Input, Row, Select, Text } from '@trezor/components';
import { MagnifyingGlassIcon } from '@trezor/icons';

import { type SearchAssetSelectConfig, useNetworkSelect } from './hooks/useNetworkSelect';

export type SearchAssetProps<TSymbol extends NetworkSymbol = NetworkSymbol> = {
    searchPlaceholder: string;
    search: string;
    setSearch: (value: string) => void;
    selectConfig?: SearchAssetSelectConfig<TSymbol>;
    autoFocus?: boolean;
};

export const SearchAsset = <TSymbol extends NetworkSymbol>({
    searchPlaceholder,
    search,
    setSearch,
    selectConfig,
    autoFocus = false,
}: SearchAssetProps<TSymbol>) => {
    const { options, selectedOption } = useNetworkSelect(selectConfig);
    const dataTestIdBase = '@asset-picker/search';

    const networkSelect = selectConfig ? (
        <Select
            options={options}
            value={selectedOption}
            onChange={option => selectConfig.onChange(option.value)}
            size="small"
            isClean
            formatOptionLabel={(option, meta) => (
                <Row
                    gap={8}
                    data-testid={
                        meta.context === 'menu'
                            ? `${dataTestIdBase}/filter/select-option/${option.value ?? 'all-networks'}`
                            : `${dataTestIdBase}/filter/select-option-value/${option.value ?? 'all-networks'}`
                    }
                >
                    {option.icon}
                    <Text typographyStyle="body-sm" textWrap="nowrap">
                        {option.label}
                    </Text>
                </Row>
            )}
            data-testid={`${dataTestIdBase}/filter`}
            openMenuOnFocus={false}
        />
    ) : undefined;

    return (
        <Input
            data-testid={`${dataTestIdBase}/input`}
            placeholder={searchPlaceholder}
            value={search}
            onChange={event => setSearch(event.target.value)}
            onClear={() => setSearch('')}
            leftContent={
                <Icon as={MagnifyingGlassIcon} intent="neutral" priority="secondary" size={16} />
            }
            rightContent={networkSelect}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={autoFocus}
            onBlur={() => {
                const trimmedSearch = search.trim();

                if (trimmedSearch !== search) {
                    setSearch(trimmedSearch);
                }
            }}
        />
    );
};
