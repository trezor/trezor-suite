import { events, injectDesktopAnalytics } from '@suite/analytics';
import { DebugOnlyBadge, selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import { gotoThunk, selectRouterParams } from '@suite/router';
import { selectIsNftSectionEnabled } from '@suite/settings';
import { getNetworkOptional } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { type NavigationItem, SubpageNavigation } from 'src/components/suite/layouts/SuiteLayout';
import { useGoToWithAnalytics } from 'src/components/suite/layouts/SuiteLayout/PageHeader/useGoToWithAnalytics';
import { useSelector } from 'src/hooks/suite';
import { type WalletParams } from 'src/types/wallet';

type AccountNavigationProps = {
    account?: Account;
};

export const AccountNavigation = ({ account }: AccountNavigationProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const routerParams = useSelector(selectRouterParams) as WalletParams;
    const enabledNftSection = useSelector(selectIsNftSectionEnabled);
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const network = getNetworkOptional(routerParams?.symbol);
    const goToWithAnalytics = useGoToWithAnalytics(account);

    const accountTabs: NavigationItem[] = [
        {
            id: 'wallet-index',
            callback: () => {
                goToWithAnalytics({ routeName: 'wallet-index', preserveParams: true });
            },
            title: <Translation id="TR_NAV_TRANSACTIONS" />,
            isHidden: false,
            'data-testid': '@wallet/menu/wallet-overview',
        },
        {
            id: 'wallet-tokens',
            callback: () => {
                goToWithAnalytics({ routeName: 'wallet-tokens', preserveParams: true });
            },
            title: <Translation id="TR_NAV_TOKENS" />,
            isHidden: !hasNetworkFeatures(account, 'tokens'),
            activeRoutes: [
                'wallet-tokens',
                'wallet-tokens-hidden',
                'wallet-tokens-inactive',
                'wallet-tokens-defi',
            ],
            'data-testid': '@wallet/menu/wallet-tokens',
        },
        {
            id: 'wallet-nfts',
            callback: () => {
                goToWithAnalytics({ routeName: 'wallet-nfts', preserveParams: true });
            },
            title: <Translation id="TR_NAV_NFTS" />,
            isHidden: !hasNetworkFeatures(account, 'nfts') || !enabledNftSection,
            activeRoutes: ['wallet-nfts', 'wallet-nfts-hidden'],
            'data-testid': '@wallet/menu/wallet-nfts',
        },
        {
            id: 'wallet-staking',
            callback: () => {
                goToWithAnalytics({ routeName: 'wallet-staking', preserveParams: true });

                analytics.report({
                    type: events.stakingNavigateEvent.name,
                    payload: {
                        action: 'navigate',
                        from: 'account/navigation',
                        networkSymbol: network?.symbol,
                    },
                });
            },
            title: <Translation id="TR_NAV_STAKING" />,
            isHidden: !hasNetworkFeatures(account, 'staking'),
            'data-testid': '@wallet/menu/staking',
        },
        {
            id: 'wallet-coinjoin',
            // Coinjoin surfaces report nothing to analytics.
            callback: () => {
                dispatch(gotoThunk({ routeName: 'wallet-coinjoin', preserveParams: true }));
            },
            title: <Translation id="TR_ACCOUNT_TYPE_COINJOIN" />,
            isHidden: account?.backendType !== 'coinjoin',
            activeRoutes: ['wallet-coinjoin', 'wallet-anonymize'],
            'data-testid': '@wallet/menu/wallet-coinjoin',
        },
        {
            id: 'wallet-details',
            callback: () => {
                goToWithAnalytics({ routeName: 'wallet-details', preserveParams: true });
            },
            title: <Translation id="TR_NAV_DETAILS" />,
            'data-testid': `@wallet/menu/wallet-details`,
        },
        // Debug only: trading form embed preview, revert together with the wallet-trade route
        {
            id: 'wallet-trade',
            callback: () => {
                dispatch(gotoThunk({ routeName: 'wallet-trade', preserveParams: true }));
            },
            title: (
                <DebugOnlyBadge>
                    <Translation id="TR_NAV_TRADE" />
                </DebugOnlyBadge>
            ),
            isHidden: !isDebugModeActive,
            'data-testid': '@wallet/menu/wallet-trade',
        },
    ];

    return <SubpageNavigation data-testid="@wallet/menu " items={accountTabs} />;
};
