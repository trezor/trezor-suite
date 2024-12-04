import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { selectCoinDefinitions, selectNftDefinitions } from '@suite-common/token-definitions';
import { IconButton, IconName, Row, SubTabs } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { Route } from '@suite-common/suite-types';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { getTokens, GetTokensOutputType } from 'src/utils/wallet/tokenUtils';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { SearchAction } from 'src/components/wallet/SearchAction';
import { openModal } from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';

import { TranslationKey } from '../../../components/suite/Translation';

type SubTabConfig = {
    isNft: boolean;
    tokens: GetTokensOutputType;
    goToRoute: (route: Route['name']) => () => void;
};

type SubTabItem = {
    id: string;
    iconName: IconName;
    onClick: () => void;
    count: number;
    labelId: TranslationKey;
};

const getSubTabConfig = ({ isNft, tokens, goToRoute }: SubTabConfig) =>
    [
        {
            id: isNft ? 'wallet-nfts' : 'wallet-tokens',
            iconName: isNft ? 'pictureFrame' : 'tokens',
            onClick: goToRoute(isNft ? 'wallet-nfts' : 'wallet-tokens'),
            count: tokens.shownWithBalance.length,
            labelId: isNft ? 'TR_NAV_COLLECTIONS' : 'TR_NAV_TOKENS',
        },
        {
            id: isNft ? 'wallet-nfts-hidden' : 'wallet-tokens-hidden',
            iconName: 'hide',
            onClick: goToRoute(isNft ? 'wallet-nfts-hidden' : 'wallet-tokens-hidden'),
            count: tokens.hiddenWithBalance.length,
            labelId: 'TR_HIDDEN',
        },
    ] satisfies SubTabItem[];

interface TokensNavigationProps {
    selectedAccount: SelectedAccountLoaded;
    searchQuery: string;
    setSearchQuery: Dispatch<SetStateAction<string>>;
    isNft?: boolean;
}

export const TokensNavigation = ({
    selectedAccount,
    searchQuery,
    setSearchQuery,
    isNft = false,
}: TokensNavigationProps) => {
    const { account } = selectedAccount;
    const [isExpanded, setExpanded] = useState(false);
    const routeName = useSelector(selectRouteName);
    const tokenDefinitions = useSelector(state =>
        isNft
            ? selectNftDefinitions(state, selectedAccount.account.symbol)
            : selectCoinDefinitions(state, selectedAccount.account.symbol),
    );
    const isDebug = useSelector(selectIsDebugModeActive);
    const dispatch = useDispatch();

    const tokens = getTokens({
        tokens: selectedAccount.account.tokens || [],
        symbol: selectedAccount.account.symbol,
        tokenDefinitions,
        isNft,
    });
    const showAddToken = ['ethereum'].includes(account.networkType) && isDebug && !isNft;

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
        <Row alignItems="center" justifyContent="space-between">
            <SubTabs activeItemId={routeName} size="medium">
                {getSubTabConfig({ isNft, tokens, goToRoute }).map(tab => (
                    <SubTabs.Item
                        key={tab.id}
                        id={tab.id}
                        iconName={tab.iconName}
                        onClick={tab.onClick}
                        count={tab.count}
                    >
                        <Translation id={tab.labelId} />
                    </SubTabs.Item>
                ))}
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
