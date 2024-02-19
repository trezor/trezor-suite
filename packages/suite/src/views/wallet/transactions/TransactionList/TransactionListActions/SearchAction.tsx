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
import styled, { css, useTheme } from 'styled-components';
import { Input, Icon, KEYBOARD_CODE, motionEasing } from '@trezor/components';
import { useDispatch } from 'src/hooks/suite';
import { useTranslation } from 'src/hooks/suite/useTranslation';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Account } from 'src/types/wallet';
import { TooltipSymbol, Translation } from 'src/components/suite';
import { isFeatureFlagEnabled, getTxsPerPage } from '@suite-common/suite-utils';
import { fetchTransactionsThunk } from '@suite-common/wallet-core';
import { borders, spacingsPx } from '@trezor/theme';

const Container = styled.div`
    display: flex;
    align-items: center;
`;

const TRANSITION_DURATION = 0.26;
const easingValues = motionEasing.transition.join(', '); // TODO: add to motionEasing

const StyledTooltipSymbol = styled(TooltipSymbol)<{ isExpanded: boolean }>`
    transition: all ${TRANSITION_DURATION * 1.5}s cubic-bezier(${easingValues});

    ${({ isExpanded }) =>
        !isExpanded &&
        css`
            opacity: 0;
            transform: translateX(20px);
        `}
`;

const INPUT_WIDTH = '38px';

const StyledInput = styled(Input)<{ isExpanded: boolean }>`
    width: ${({ isExpanded }) => (isExpanded ? '210px' : INPUT_WIDTH)};
    margin-right: ${spacingsPx.xs};
    transition: width ${TRANSITION_DURATION}s cubic-bezier(${easingValues});
    overflow: hidden;
    border-radius: ${borders.radii.full};

    input {
        height: ${INPUT_WIDTH};
        border: none;
    }

    /* TODO: remove this when clicking on addons in Input is handled better */
    div > div:first-child {
        pointer-events: none;
    }
`;

const SearchIcon = styled(Icon)`
    pointer-events: none;
`;

export interface SearchProps {
    account: Account;
    searchQuery: string;
    setSearch: Dispatch<SetStateAction<string>>;
    setSelectedPage: Dispatch<SetStateAction<number>>;
}

export const SearchAction = ({ account, searchQuery, setSearch, setSelectedPage }: SearchProps) => {
    const [isExpanded, setExpanded] = useState(false);
    const [hasFetchedAll, setHasFetchedAll] = useState(false);

    const theme = useTheme();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const onFocus = useCallback(() => {
        setExpanded(true);
        if (searchQuery !== '' && inputRef.current) {
            inputRef.current.select();
        }
    }, [setExpanded, searchQuery]);

    const onBlur = useCallback(() => {
        if (searchQuery === '') {
            setExpanded(false);
        }
    }, [setExpanded, searchQuery]);

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
        <Container>
            <StyledTooltipSymbol
                content={<Translation id="TR_TRANSACTIONS_SEARCH_TOOLTIP" />}
                isExpanded={isExpanded}
            />

            <StyledInput
                isExpanded={isExpanded}
                data-test-id="@wallet/accounts/search-icon"
                size="small"
                innerRef={inputRef}
                innerAddon={<SearchIcon icon="SEARCH" size={16} color={theme.iconSubdued} />}
                placeholder={isExpanded ? translationString('TR_SEARCH_TRANSACTIONS') : undefined}
                onChange={onSearch}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                value={searchQuery}
                innerAddonAlign="left"
                maxLength={512}
                showClearButton="always"
                onClear={() => setSearch('')}
            />
        </Container>
    );
};
