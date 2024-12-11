import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { selectCoinDefinitions } from '@suite-common/token-definitions';
import { spacings } from '@trezor/theme';
import { IconButton, Row, SubTabs } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { Route } from '@suite-common/suite-types';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { getTokens } from 'src/utils/wallet/tokenUtils';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { SearchAction } from 'src/components/wallet/SearchAction';
import { openModal } from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';

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

    const goToRoute = (route: Route['name']) => () => {
        dispatch(goto(route, { preserveParams: true }));
    };

    useEffect(() => {
        setSearchQuery('');
        setExpanded(false);
    }, [account.symbol, account.index, account.accountType, setSearchQuery]);

    return (
        <Row alignItems="center" justifyContent="space-between" margin={{ bottom: spacings.md }}>
            <SubTabs activeItemId={routeName} size="medium">
                <SubTabs.Item
                    id="wallet-tokens"
                    iconName="tokens"
                    onClick={goToRoute('wallet-tokens')}
                    count={tokens.shownWithBalance.length}
                >
                    <Translation id="TR_NAV_TOKENS" />
                </SubTabs.Item>
                <SubTabs.Item
                    id="wallet-tokens-hidden"
                    iconName="hide"
                    onClick={goToRoute('wallet-tokens-hidden')}
                    count={tokens.hiddenWithBalance.length}
                >
                    <Translation id="TR_HIDDEN" />
                </SubTabs.Item>
            </SubTabs>
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
