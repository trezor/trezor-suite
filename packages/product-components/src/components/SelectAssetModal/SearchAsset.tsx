import { Icon, Input } from '@trezor/components';

interface SearchAssetProps {
    searchPlaceholder: string;
    search: string;
    setSearch: (value: string) => void;
}

export const SearchAsset = ({ searchPlaceholder, search, setSearch }: SearchAssetProps) => (
    <Input
        placeholder={searchPlaceholder}
        value={search}
        onChange={event => setSearch(event.target.value)}
        onClear={() => setSearch('')}
        showClearButton="always"
        innerAddon={<Icon name="search" variant="tertiary" size="medium" />}
        innerAddonAlign="left"
    />
);
