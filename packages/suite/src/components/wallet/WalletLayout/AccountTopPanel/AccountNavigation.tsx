import { WalletParams } from 'src/types/wallet';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { getNetwork, hasNetworkFeatures } from '@suite-common/wallet-utils';
import { goto } from 'src/actions/suite/routerActions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { EventType, analytics } from '@trezor/suite-analytics';
import { SubpageNavigation } from 'src/components/suite/layouts/SuiteLayout';
import { Route } from '@suite-common/suite-types';

// to make sure the routes are taken from the main route definition
type AccountTab = Extract<
    Route['name'],
    'wallet-index' | 'wallet-details' | 'wallet-tokens' | 'wallet-staking'
>;

export const ACCOUNT_TABS = ['wallet-index', 'wallet-details', 'wallet-tokens', 'wallet-staking'];

type NavigationItem = {
    id: AccountTab;
    callback: () => void;
    title: JSX.Element;
    'data-test'?: string;
    isHidden?: boolean;
};

export const AccountNavigation = () => {
    const account = useSelector(selectSelectedAccount);
    const routerParams = useSelector(state => state.router.params) as WalletParams;
    const dispatch = useDispatch();

    const network = getNetwork(routerParams?.symbol || '');
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
            id: 'wallet-details',
            callback: () => {
                goToWithAnalytics('wallet-details', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_DETAILS" />,
            isHidden: !['cardano', 'bitcoin'].includes(networkType),
        },
        {
            id: 'wallet-tokens',
            callback: () => {
                goToWithAnalytics('wallet-tokens', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_TOKENS" />,
            isHidden: !['cardano', 'ethereum', 'solana'].includes(networkType),
        },
        {
            id: 'wallet-staking',
            callback: () => {
                goToWithAnalytics('wallet-staking', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_STAKING" />,
            isHidden: !hasNetworkFeatures(account, 'staking'),
        },
    ];

    return <SubpageNavigation items={accountTabs} />;
};
