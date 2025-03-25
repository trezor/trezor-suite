import { getNetworkOptional } from '@suite-common/wallet-config';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { EventType, analytics } from '@trezor/suite-analytics';

import { Translation } from 'src/components/suite/Translation';
import { NavigationItem, SubpageNavigation } from 'src/components/suite/layouts/SuiteLayout';
import { useGoToWithAnalytics } from 'src/components/suite/layouts/SuiteLayout/PageHeader/useGoToWithAnalytics';
import { useSelector } from 'src/hooks/suite';
import { selectHasExperimentalFeature } from 'src/reducers/suite/suiteReducer';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { WalletParams } from 'src/types/wallet';

export const AccountNavigation = () => {
    const account = useSelector(selectSelectedAccount);
    const routerParams = useSelector(state => state.router.params) as WalletParams;
    const enabledNftSection = useSelector(selectHasExperimentalFeature('nft-section'));
    const network = getNetworkOptional(routerParams?.symbol);
    const networkType = account?.networkType || network?.networkType || '';
    const goToWithAnalytics = useGoToWithAnalytics(account);

    const accountTabs: NavigationItem[] = [
        {
            id: 'wallet-index',
            callback: () => {
                goToWithAnalytics('wallet-index', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_TRANSACTIONS" />,
            isHidden: false,
        },
        {
            id: 'wallet-tokens',
            callback: () => {
                goToWithAnalytics('wallet-tokens', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_TOKENS" />,
            isHidden: !['cardano', 'ethereum', 'solana'].includes(networkType),
            activeRoutes: ['wallet-tokens', 'wallet-tokens-hidden'],
            'data-testid': '@wallet/menu/wallet-tokens',
        },
        {
            id: 'wallet-nfts',
            callback: () => {
                goToWithAnalytics('wallet-nfts', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_NFTS" />,
            isHidden: !hasNetworkFeatures(account, 'nfts') || !enabledNftSection,
            activeRoutes: ['wallet-nfts', 'wallet-nfts-hidden'],
            'data-testid': '@wallet/menu/wallet-nfts',
        },
        {
            id: 'wallet-staking',
            callback: () => {
                goToWithAnalytics('wallet-staking', { preserveParams: true });

                analytics.report({
                    type: EventType.StakingNavigate,
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
                goToWithAnalytics('wallet-details', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_DETAILS" />,
            'data-testid': `@wallet/menu/wallet-details`,
        },
    ];

    return <SubpageNavigation items={accountTabs} />;
};
