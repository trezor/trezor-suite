import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { getNetworkOptional } from '@suite-common/wallet-config';
import { EventType, analytics } from '@trezor/suite-analytics';

import { WalletParams } from 'src/types/wallet';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { NavigationItem, SubpageNavigation } from 'src/components/suite/layouts/SuiteLayout';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

export const ACCOUNT_TABS = [
    'wallet-index',
    'wallet-details',
    'wallet-tokens',
    'wallet-nfts',
    'wallet-nfts-hidden',
    'wallet-tokens-hidden',
    'wallet-staking',
];

export const AccountNavigation = () => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    const account = useSelector(selectSelectedAccount);
    const routerParams = useSelector(state => state.router.params) as WalletParams;
    const dispatch = useDispatch();

    const network = getNetworkOptional(routerParams?.symbol);
    const networkType = account?.networkType || network?.networkType || '';

    const goToWithAnalytics = (...[routeName, options]: Parameters<typeof goto>) => {
        if (account?.symbol) {
            analytics.report({
                type: EventType.AccountsActions,
                payload: { symbol: account.symbol, action: routeName },
            });
        }
        dispatch(goto(routeName, options));
    };

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
            isHidden: !hasNetworkFeatures(account, 'nfts'),
            activeRoutes: ['wallet-nfts', 'wallet-nfts-hidden'],
            'data-testid': '@wallet/menu/wallet-nfts',
        },
        {
            id: 'wallet-staking',
            callback: () => {
                goToWithAnalytics('wallet-staking', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_STAKING" />,
            // TODO: remove 'solana' and debug mode check from the condition when staking will be ready for launch
            isHidden:
                !hasNetworkFeatures(account, 'staking') ||
                (!isDebugModeActive && 'solana' === networkType),
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
