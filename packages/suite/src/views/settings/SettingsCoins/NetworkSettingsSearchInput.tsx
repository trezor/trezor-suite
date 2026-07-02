import { useTranslation } from '@suite/intl';
import { Icon, Input } from '@trezor/components';

type NetworkSettingsSearchInputProps = {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onSearchClear: () => void;
    dataTestId?: string;
};

export const NetworkSettingsSearchInput = ({
    searchQuery,
    onSearchChange,
    onSearchClear,
    dataTestId = '@settings-coins/network-search-input',
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
            data-testid={dataTestId}
            leftContent={
                <Icon name="magnifyingGlass" intent="neutral" priority="secondary" size={16} />
            }
        />
    );
};
