import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { selectCoinDefinitions } from '@suite-common/token-definitions';
import { spacings } from '@trezor/theme';
import { IconButton, Row } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { NavigationItem } from 'src/components/suite/layouts/SuiteLayout/Sidebar/NavigationItem';
import { getTokens } from 'src/utils/wallet/tokenUtils';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { SearchAction } from 'src/components/wallet/SearchAction';
import { openModal } from 'src/actions/suite/modalActions';

interface TokensNavigationProps {
    selectedAccount: SelectedAccountLoaded;
    searchQuery: string;
    setSearchQuery: Dispatch<SetStateAction<string>>;
}

export const TokensNavigation = ({
    selectedAccount,
    searchQuery,
    setSearchQuery,
}: TokensNavigationProps) => {
    const { account } = selectedAccount;

    const [isExpanded, setExpanded] = useState(false);

    const routeName = useSelector(selectRouteName);

    const coinDefinitions = useSelector(state =>
        selectCoinDefinitions(state, selectedAccount.account.symbol),
    );
    const isDebug = useSelector(selectIsDebugModeActive);
    const dispatch = useDispatch();

    const tokens = getTokens(
        selectedAccount.account.tokens || [],
        selectedAccount.account.symbol,
        coinDefinitions,
    );
    const showAddToken = ['ethereum'].includes(account.networkType) && isDebug;

    const handleAddToken = () => {
        if (account.symbol) {
            analytics.report({
                type: EventType.AccountsActions,
                payload: { symbol: account.symbol, action: 'add-token' },
            });
        }
        dispatch(openModal({ type: 'add-token' }));
    };

    useEffect(() => {
        setSearchQuery('');
        setExpanded(false);
    }, [account.symbol, account.index, account.accountType, setSearchQuery]);

    return (
        <Row alignItems="center" justifyContent="space-between" margin={{ bottom: spacings.md }}>
            <Row alignItems="center" gap={spacings.xxs}>
                <NavigationItem
                    nameId="TR_MY_TOKENS"
                    isActive={routeName === 'wallet-tokens'}
                    icon="tokens"
                    goToRoute="wallet-tokens"
                    preserveParams
                    iconSize="mediumLarge"
                    itemsCount={tokens.shownWithBalance.length || undefined}
                    isRounded
                    typographyStyle="hint"
                />
                <NavigationItem
                    nameId="TR_HIDDEN"
                    isActive={routeName === 'wallet-tokens-hidden'}
                    icon="hide"
                    goToRoute="wallet-tokens-hidden"
                    preserveParams
                    iconSize="mediumLarge"
                    itemsCount={tokens.hiddenWithBalance.length || undefined}
                    isRounded
                    typographyStyle="hint"
                />
            </Row>
            <Row>
                <SearchAction
                    tooltipText="TR_TOKENS_SEARCH_TOOLTIP"
                    placeholder="TR_SEARCH_TOKENS"
                    isExpanded={isExpanded}
                    searchQuery={searchQuery}
                    setExpanded={setExpanded}
                    setSearch={setSearchQuery}
                    onSearch={setSearchQuery}
                    data-testid="@wallet/accounts/search-icon"
                />
                {showAddToken && (
                    <IconButton
                        icon="plus"
                        size="small"
                        variant="tertiary"
                        onClick={handleAddToken}
                    />
                )}
            </Row>
        </Row>
    );
};
