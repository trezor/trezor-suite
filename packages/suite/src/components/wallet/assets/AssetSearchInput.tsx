import { type TranslationKey, useTranslation } from '@suite/intl';
import { Icon, Input } from '@trezor/components';
import { MagnifyingGlassIcon } from '@trezor/icons';

type AssetSearchInputProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder: TranslationKey;
    'data-testid': string;
};

/** The small search field above an account's tokens, NFTs or assets. */
export const AssetSearchInput = ({
    value,
    onChange,
    placeholder,
    'data-testid': dataTestId,
}: AssetSearchInputProps) => {
    const { translationString } = useTranslation();

    return (
        <Input
            data-testid={dataTestId}
            placeholder={translationString(placeholder)}
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
