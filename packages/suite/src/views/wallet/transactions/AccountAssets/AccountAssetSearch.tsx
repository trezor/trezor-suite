import { useTranslation } from '@suite/intl';
import { Icon, Input } from '@trezor/components';
import { MagnifyingGlassIcon } from '@trezor/icons';

type AccountAssetSearchProps = {
    value: string;
    onChange: (value: string) => void;
};

export const AccountAssetSearch = ({ value, onChange }: AccountAssetSearchProps) => {
    const { translationString } = useTranslation();

    return (
        <Input
            data-testid="@wallet/account-assets/search"
            placeholder={translationString('TR_SEARCH_TOKENS')}
            value={value}
            onChange={event => onChange(event.target.value)}
            onClear={() => onChange('')}
            size="small"
            leftContent={
                <Icon as={MagnifyingGlassIcon} intent="neutral" priority="secondary" size={16} />
            }
        />
    );
};
