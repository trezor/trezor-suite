import {
    type ChangeEvent,
    type Dispatch,
    type KeyboardEvent,
    type SetStateAction,
    useCallback,
    useRef,
} from 'react';

import { useTranslation } from '@suite/intl';
import { Icon, Input, KEYBOARD_CODE } from '@trezor/components';

export type UtxoSearchProps = {
    searchQuery: string;
    setSearch: Dispatch<SetStateAction<string>>;
    setSelectedPage: Dispatch<SetStateAction<number>>;
};

export const UtxoSearch = ({ searchQuery, setSearch, setSelectedPage }: UtxoSearchProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const { translationString } = useTranslation();

    const onKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Handle ESC (un-focus)
            if (event.code === KEYBOARD_CODE.ESCAPE && inputRef.current) {
                setSearch('');
                inputRef.current.blur();
            }
        },
        [setSearch],
    );

    const onSearch = useCallback(
        ({ target }: ChangeEvent<HTMLInputElement>) => {
            setSearch(target.value);
            setSelectedPage(1);
        },
        [setSearch, setSelectedPage],
    );

    return (
        <Input
            data-testid="@wallet/send/search-icon"
            innerRef={inputRef}
            leftContent={
                <Icon name="magnifyingGlass" size={16} intent="neutral" priority="secondary" />
            }
            placeholder={translationString('TR_SEARCH_UTXOS')}
            onChange={onSearch}
            onKeyDown={onKeyDown}
            value={searchQuery}
            maxLength={512}
            showClearButton={true}
            size="small"
            onClear={() => setSearch('')}
        />
    );
};
