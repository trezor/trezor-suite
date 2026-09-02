import { type Dispatch, type SetStateAction, useEffect } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectIsDebugModeActive } from '@suite/debug';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { type Route, goto, selectRouteName } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { selectCoinDefinitions, selectNftDefinitions } from '@suite-common/token-definitions';
import { type NetworkType } from '@suite-common/wallet-config';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { isErc4626 } from '@suite-common/wallet-utils';
import {
    Button,
    Icon,
    IconButton,
    type IconComponent,
    Input,
    Row,
    SubTabs,
} from '@trezor/components';
import {
    CoinSlashIcon,
    CoinsIcon,
    EyeSlashIcon,
    MagnifyingGlassIcon,
    PercentIcon,
    PictureFrameIcon,
    PlusIcon,
} from '@trezor/icons';
import { arrayPartition } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { type GetTokensOutputType, getTokens } from 'src/utils/wallet/tokenUtils';

type SubTabConfig = {
    isNft: boolean;
    tokens: GetTokensOutputType;
    goToRoute: (route: Route['name']) => () => void;
    networkType: NetworkType;
};

type SubTabItem = {
    id: string;
    iconName: IconComponent;
    onClick: () => void;
    count?: number;
    labelId: TranslationKey;
};

const getSubTabConfig = ({ isNft, tokens, goToRoute, networkType }: SubTabConfig) => {
    const [erc4626Tokens, normalTokens] = arrayPartition(tokens.shownWithBalance, isErc4626);
    // DeFi section is relevant only for EVM networks, but there it is always available.
    const showDefiTab = !isNft && networkType === 'ethereum';

    const baseConfig: SubTabItem[] = [
        {
            id: isNft ? 'wallet-nfts' : 'wallet-tokens',
            iconName: isNft ? PictureFrameIcon : CoinsIcon,
            onClick: goToRoute(isNft ? 'wallet-nfts' : 'wallet-tokens'),
            count: normalTokens.length,
            labelId: isNft ? 'TR_NAV_COLLECTIONS' : 'TR_NAV_TOKENS',
        },
        ...(showDefiTab
            ? [
                  {
                      id: 'wallet-tokens-defi',
                      iconName: PercentIcon,
                      onClick: goToRoute('wallet-tokens-defi'),
                      count: erc4626Tokens.length,
                      labelId: 'TR_DEFI',
                  } as const,
              ]
            : []),
        {
            id: isNft ? 'wallet-nfts-hidden' : 'wallet-tokens-hidden',
            iconName: EyeSlashIcon,
            onClick: goToRoute(isNft ? 'wallet-nfts-hidden' : 'wallet-tokens-hidden'),
            count: tokens.hiddenWithBalance.length,
            labelId: 'TR_HIDDEN',
        },
    ];

    // Add inactive tokens tab for Stellar network only
    if (networkType === 'stellar' && !isNft) {
        baseConfig.push({
            id: 'wallet-tokens-inactive',
            iconName: CoinSlashIcon,
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
    const { analytics } = useServices(selectDesktopAnalyticsDep);
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
        dispatch(goto({ routeName: route, preserveParams: true }));
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
                        icon={tab.iconName}
                        onClick={tab.onClick}
                        count={tab.count}
                    >
                        <Translation id={tab.labelId} />
                    </SubTabs.Item>
                ))}
            </SubTabs>
            <Row gap={12}>
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
                            as={MagnifyingGlassIcon}
                            intent="neutral"
                            priority="secondary"
                            size={16}
                        />
                    }
                />
                {showAddToken && (
                    <IconButton
                        icon={PlusIcon}
                        size="medium"
                        intent="neutral"
                        priority="secondary"
                        onClick={handleAddToken}
                        tooltip={{ content: <Translation id="TR_ADD_TOKEN_SUBMIT" /> }}
                    />
                )}
            </Row>
        </Row>
    );
};
