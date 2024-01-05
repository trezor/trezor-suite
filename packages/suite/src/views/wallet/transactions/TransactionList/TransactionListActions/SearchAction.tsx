import {
    useState,
    useCallback,
    useRef,
    useEffect,
    Dispatch,
    SetStateAction,
    ChangeEvent,
    KeyboardEvent,
} from 'react';
import styled, { css } from 'styled-components';
import { Input, Icon, useTheme, Tooltip, KEYBOARD_CODE } from '@trezor/components';
import { useDispatch } from 'src/hooks/suite';
import { useTranslation } from 'src/hooks/suite/useTranslation';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite';
import { isFeatureFlagEnabled, getTxsPerPage } from '@suite-common/suite-utils';
import { fetchTransactionsThunk } from '@suite-common/wallet-core';

const Wrapper = styled.div<{ expanded: boolean }>`
    margin-right: 20px;
    width: 36px;
    transition: width 0.4s ease-in-out;
    overflow: hidden;
    cursor: pointer;

    ${({ expanded }) =>
        expanded &&
        css`
            width: 210px;
            cursor: auto;
        `}
`;

const StyledInput = styled(Input)<{ expanded: boolean }>`
    border: none;
    ${({ expanded }) =>
        !expanded &&
        css`
            cursor: pointer;
            padding: 0 16px;
        `}
`;
export interface SearchProps {
    account: Account;
    searchQuery: string;
    setSearch: Dispatch<SetStateAction<string>>;
    setSelectedPage: Dispatch<SetStateAction<number>>;
}

export const SearchAction = ({
    account,
    searchQuery: search,
    setSearch,
    setSelectedPage,
}: SearchProps) => {
    const theme = useTheme();
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [hasFetchedAll, setHasFetchedAll] = useState(false);
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const onFocus = useCallback(() => {
        setExpanded(true);
        if (search !== '' && inputRef.current) {
            inputRef.current.select();
        }
    }, [setExpanded, search]);

    const onBlur = useCallback(() => {
        if (search === '') {
            setExpanded(false);
        }
    }, [setExpanded, search]);

    const onKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Handle esc (unfocus)
            if (event.code === KEYBOARD_CODE.ESCAPE && inputRef.current) {
                setSearch('');
                inputRef.current.blur();
            }
        },
        [setSearch],
    );

    const onSearch = useCallback(
        async ({ target }: ChangeEvent<HTMLInputElement>) => {
            setSelectedPage(1);
            setSearch(target.value);

            if (!hasFetchedAll) {
                setHasFetchedAll(true);

                try {
                    await dispatch(
                        fetchTransactionsThunk({
                            accountKey: account.key,
                            page: 2,
                            perPage: getTxsPerPage(account.networkType),
                            noLoading: true,
                            recursive: true,
                        }),
                    );
                } catch (err) {
                    dispatch(
                        notificationsActions.addToast({
                            type: 'error',
                            error: translationString('TR_SEARCH_FAIL'),
                        }),
                    );
                }
            }
        },
        [account, dispatch, hasFetchedAll, setSearch, setSelectedPage, translationString],
    );

    const onSearchKeys = useCallback(
        (event: KeyboardEvent) => {
            if (
                inputRef.current &&
                (event.ctrlKey || event.metaKey) &&
                event.key === KEYBOARD_CODE.LETTER_F
            ) {
                event.preventDefault();
                inputRef.current.focus();
            }
        },
        [inputRef],
    );

    useEffect(() => {
        setHasFetchedAll(false);
        setExpanded(false);
        setSearch('');

        // @ts-expect-error
        document.addEventListener('keydown', onSearchKeys);
        return () => {
            // @ts-expect-error
            document.removeEventListener('keydown', onSearchKeys);
        };
    }, [account.symbol, account.index, account.accountType, setSearch, onSearchKeys]);

    if (!isFeatureFlagEnabled('SEARCH_TRANSACTIONS')) {
        return null;
    }

    return (
        <Wrapper
            ref={wrapperRef}
            onClick={() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }}
            expanded={expanded}
        >
            <Tooltip content={<Translation id="TR_TRANSACTIONS_SEARCH_TOOLTIP" />}>
                <StyledInput
                    expanded={expanded}
                    data-test="@wallet/accounts/search-icon"
                    variant="small"
                    innerRef={inputRef}
                    innerAddon={<Icon icon="SEARCH" size={16} color={theme.TYPE_DARK_GREY} />}
                    placeholder={expanded ? translationString('TR_SEARCH_TRANSACTIONS') : undefined}
                    onChange={onSearch}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onKeyDown={onKeyDown}
                    value={search}
                    addonAlign="left"
                    maxLength={512}
                    noError
                    noTopLabel
                    clearButton="always"
                    onClear={() => {
                        setSearch('');
                    }}
                />
            </Tooltip>
        </Wrapper>
    );
};
