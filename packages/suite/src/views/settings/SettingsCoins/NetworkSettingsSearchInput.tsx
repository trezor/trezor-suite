import { useTranslation } from '@suite/intl';
import { Icon, Input } from '@trezor/components';

type NetworkSettingsSearchInputProps = {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onSearchClear: () => void;
};

export const NetworkSettingsSearchInput = ({
    searchQuery,
    onSearchChange,
    onSearchClear,
}: NetworkSettingsSearchInputProps) => {
    const { translationString } = useTranslation();

    return (
        <Input
            value={searchQuery}
            onChange={event => onSearchChange(event.target.value)}
            onClear={onSearchClear}
            placeholder={translationString('TR_SEARCH_NETWORK')}
            showClearButton
            width="100%"
            data-testid="@settings-coins/network-search-input"
            leftContent={
                <Icon name="magnifyingGlass" intent="neutral" priority="secondary" size={16} />
            }
        />
    );
};
