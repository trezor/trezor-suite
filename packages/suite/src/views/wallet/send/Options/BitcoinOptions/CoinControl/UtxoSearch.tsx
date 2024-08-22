import { useCallback, useRef, Dispatch, SetStateAction, ChangeEvent, KeyboardEvent } from 'react';
import styled, { useTheme } from 'styled-components';
import { Input, IconLegacy, KEYBOARD_CODE } from '@trezor/components';
import { useTranslation } from 'src/hooks/suite/useTranslation';

const Container = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
`;

export type UtxoSearchProps = {
    searchQuery: string;
    setSearch: Dispatch<SetStateAction<string>>;
    setSelectedPage: Dispatch<SetStateAction<number>>;
};

export const UtxoSearch = ({ searchQuery, setSearch, setSelectedPage }: UtxoSearchProps) => {
    const theme = useTheme();
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
        <Container>
            <Input
                data-testid="@wallet/send/search-icon"
                innerRef={inputRef}
                innerAddon={<IconLegacy icon="SEARCH" size={16} color={theme.iconSubdued} />}
                placeholder={translationString('TR_SEARCH_UTXOS')}
                onChange={onSearch}
                onKeyDown={onKeyDown}
                value={searchQuery}
                innerAddonAlign="left"
                maxLength={512}
                showClearButton="always"
                size="small"
                onClear={() => setSearch('')}
            />
        </Container>
    );
};
