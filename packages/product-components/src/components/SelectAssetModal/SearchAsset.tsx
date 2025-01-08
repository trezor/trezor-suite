import { Icon, Input } from '@trezor/components';

interface SearchAssetProps {
    searchPlaceholder: string;
    search: string;
    setSearch: (value: string) => void;
    'data-testid'?: string;
}

export const SearchAsset = ({
    searchPlaceholder,
    search,
    setSearch,
    'data-testid': dataTestId,
}: SearchAssetProps) => (
    <Input
        data-testid={dataTestId}
        placeholder={searchPlaceholder}
        value={search}
        onChange={event => setSearch(event.target.value)}
        onClear={() => setSearch('')}
        showClearButton="always"
        innerAddon={<Icon name="search" variant="tertiary" size="medium" />}
        innerAddonAlign="left"
    />
);
