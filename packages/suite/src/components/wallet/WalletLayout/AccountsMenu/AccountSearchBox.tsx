import { useRef } from 'react';

import { useTranslation } from '@suite/intl';
import { Icon, Input } from '@trezor/components';

import { useAccountSearch } from 'src/hooks/suite';

export const AccountSearchBox = () => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const { translationString } = useTranslation();
    const { setCoinFilter, searchString, setSearchString } = useAccountSearch();

    const onClear = () => {
        setSearchString(undefined);
        setCoinFilter([]);
    };

    return (
        <Input
            value={searchString ?? ''}
            isClean
            onChange={e => {
                setSearchString(e.target.value);
            }}
            leftContent={
                <Icon
                    name="magnifyingGlass"
                    margin={{ left: 12, right: 20 }}
                    size={16}
                    variant="default"
                    onClick={() => {
                        inputRef?.current?.select();
                    }}
                    cursor="pointer"
                />
            }
            size="small"
            placeholder={translationString('TR_WALLET')}
            showClearButton={true}
            onClear={onClear}
            data-testid="@account-menu/search-input"
            innerRef={inputRef}
            width="100%"
        />
    );
};
