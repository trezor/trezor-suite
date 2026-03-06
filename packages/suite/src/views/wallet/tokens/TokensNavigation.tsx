import { Dispatch, SetStateAction, useEffect } from 'react';

import { events } from '@suite/analytics';
import { Translation, TranslationKey, useTranslation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { Route } from '@suite-common/suite-types';
import { selectCoinDefinitions, selectNftDefinitions } from '@suite-common/token-definitions';
import { NetworkType } from '@suite-common/wallet-config';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Button, Icon, IconButton, IconName, Input, Row, SubTabs } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { selectIsDebugModeActive } from 'src/selectors/suite/suiteSelectors';
import { useAnalytics } from 'src/support/useAnalytics';
import { GetTokensOutputType, getTokens } from 'src/utils/wallet/tokenUtils';

type SubTabConfig = {
    isNft: boolean;
    tokens: GetTokensOutputType;
    goToRoute: (route: Route['name']) => () => void;
    networkType: NetworkType;
};

type SubTabItem = {
    id: string;
    iconName: IconName;
    onClick: () => void;
    count?: number;
    labelId: TranslationKey;
};

const getSubTabConfig = ({ isNft, tokens, goToRoute, networkType }: SubTabConfig) => {
    const baseConfig: SubTabItem[] = [
        {
            id: isNft ? 'wallet-nfts' : 'wallet-tokens',
            iconName: isNft ? 'pictureFrame' : 'coins',
            onClick: goToRoute(isNft ? 'wallet-nfts' : 'wallet-tokens'),
            count: tokens.shownWithBalance.length,
            labelId: isNft ? 'TR_NAV_COLLECTIONS' : 'TR_NAV_TOKENS',
        },
        {
            id: isNft ? 'wallet-nfts-hidden' : 'wallet-tokens-hidden',
            iconName: 'eyeSlash',
            onClick: goToRoute(isNft ? 'wallet-nfts-hidden' : 'wallet-tokens-hidden'),
            count: tokens.hiddenWithBalance.length,
            labelId: 'TR_HIDDEN',
        },
    ];

    // Add inactive tokens tab for Stellar network only
    if (networkType === 'stellar' && !isNft) {
        baseConfig.push({
            id: 'wallet-tokens-inactive',
            iconName: 'coinSlash',
            onClick: goToRoute('wallet-tokens-inactive'),
            labelId: 'TR_NAV_INACTIVE_TOKENS',
        });
    }

    return baseConfig;
};

interface TokensNavigationProps {
    selectedAccount: SelectedAccountLoaded;
    searchQuery: string;
    setSearchQuery: Dispatch<SetStateAction<string>>;
    isNft?: boolean;
    onManualActivation?: () => void;
    showManualActivation?: boolean;
}

export const TokensNavigation = ({
    selectedAccount,
    searchQuery,
    setSearchQuery,
    isNft = false,
    onManualActivation,
    showManualActivation = false,
}: TokensNavigationProps) => {
    const { account } = selectedAccount;
    const routeName = useSelector(selectRouteName);
    const analytics = useAnalytics();
    const tokenDefinitions = useSelector(state =>
        isNft
            ? selectNftDefinitions(state, selectedAccount.account.symbol)
            : selectCoinDefinitions(state, selectedAccount.account.symbol),
    );
    const isDebug = useSelector(selectIsDebugModeActive);
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const tokens = getTokens({
        tokens: selectedAccount.account.tokens || [],
        symbol: selectedAccount.account.symbol,
        tokenDefinitions,
        isNft,
    });
    const { networkType } = account;
    const showAddToken = ['ethereum'].includes(networkType) && isDebug && !isNft;

    const handleAddToken = () => {
        if (account.symbol) {
            analytics.report({
                type: events.accountsActionsEvent.name,
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
    }, [account.symbol, account.index, account.accountType, setSearchQuery]);

    return (
        <Row alignItems="center" justifyContent="space-between">
            <SubTabs activeItemId={routeName} size="medium">
                {getSubTabConfig({ isNft, tokens, goToRoute, networkType }).map(tab => (
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
            <Row gap={spacings.sm}>
                {showManualActivation && onManualActivation && (
                    <Button
                        intent="neutral"
                        priority="secondary"
                        size="medium"
                        onClick={onManualActivation}
                    >
                        <Translation id="TR_ACTIVATE_MANUALLY" />
                    </Button>
                )}
                <Input
                    data-testid="@wallet/accounts/search-icon"
                    placeholder={translationString(
                        isNft ? 'TR_SEARCH_COLLECTIONS' : 'TR_SEARCH_TOKENS',
                    )}
                    value={searchQuery}
                    onChange={event => setSearchQuery(event.target.value)}
                    onClear={() => setSearchQuery('')}
                    size="small"
                    leftContent={
                        <Icon
                            name="magnifyingGlass"
                            intent="neutral"
                            priority="secondary"
                            size={16}
                        />
                    }
                />
                {showAddToken && (
                    <IconButton
                        icon="plus"
                        size="medium"
                        intent="neutral"
                        priority="secondary"
                        onClick={handleAddToken}
                    />
                )}
            </Row>
        </Row>
    );
};
