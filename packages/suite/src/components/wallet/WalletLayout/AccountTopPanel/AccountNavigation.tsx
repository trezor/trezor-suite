import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { selectRouterParams } from '@suite/router';
import { getNetworkOptional } from '@suite-common/wallet-config';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';

import { NavigationItem, SubpageNavigation } from 'src/components/suite/layouts/SuiteLayout';
import { useGoToWithAnalytics } from 'src/components/suite/layouts/SuiteLayout/PageHeader/useGoToWithAnalytics';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { selectHasExperimentalFeature } from 'src/selectors/suite/suiteSelectors';
import { useAnalytics } from 'src/support/useAnalytics';
import { WalletParams } from 'src/types/wallet';

export const AccountNavigation = () => {
    const analytics = useAnalytics();
    const account = useSelector(selectSelectedAccount);
    const routerParams = useSelector(selectRouterParams) as WalletParams;
    const enabledNftSection = useSelector(selectHasExperimentalFeature('nft-section'));
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
            activeRoutes: ['wallet-tokens', 'wallet-tokens-hidden', 'wallet-tokens-inactive'],
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
            id: 'wallet-details',
            callback: () => {
                goToWithAnalytics({ routeName: 'wallet-details', preserveParams: true });
            },
            title: <Translation id="TR_NAV_DETAILS" />,
            'data-testid': `@wallet/menu/wallet-details`,
        },
    ];

    return <SubpageNavigation data-testid="@wallet/menu " items={accountTabs} />;
};
