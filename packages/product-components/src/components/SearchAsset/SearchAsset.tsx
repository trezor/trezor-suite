import { Icon, Input } from '@trezor/components';
import { MagnifyingGlassIcon } from '@trezor/icons';

import { SearchAssetNetworkSelect } from './SearchAssetNetworkSelect';
import type { SearchAssetSelectConfig } from './hooks/useNetworkSelect';

export type SearchAssetProps = {
    searchPlaceholder: string;
    search: string;
    setSearch: (value: string) => void;
    selectConfig?: SearchAssetSelectConfig;
    onMenuOpen?: () => void;
    autoFocus?: boolean;
};

export const SearchAsset = ({
    searchPlaceholder,
    search,
    setSearch,
    selectConfig,
    onMenuOpen,
    autoFocus = false,
}: SearchAssetProps) => {
    const dataTestIdBase = '@asset-picker/search';

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
            rightContent={
                selectConfig ? (
                    <SearchAssetNetworkSelect selectConfig={selectConfig} onMenuOpen={onMenuOpen} />
                ) : undefined
            }
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
