import { ReactNode } from 'react';
import { WalletParams } from 'src/types/wallet';
import {
    AppNavigation,
    NavigationItem,
    ActionItem,
} from 'src/components/suite/AppNavigation/AppNavigation';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { getNetwork, hasNetworkFeatures } from '@suite-common/wallet-utils';
import { goto } from 'src/actions/suite/routerActions';
import { openModal } from 'src/actions/suite/modalActions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { EventType, analytics } from '@trezor/suite-analytics';

interface AccountNavigationProps {
    dataTestSuffix?: string;
    primaryContent?: ReactNode;
    inView?: boolean;
}

export const AccountNavigation = ({
    dataTestSuffix,
    primaryContent,
    inView,
}: AccountNavigationProps) => {
    const account = useSelector(selectSelectedAccount);
    const routerParams = useSelector(state => state.router.params) as WalletParams;
    const dispatch = useDispatch();

    const network = getNetwork(routerParams?.symbol || '');
    const networkType = account?.networkType || network?.networkType || '';
    const accountType = account?.accountType || routerParams?.accountType || '';

    const goToWithAnalytics = (...[routeName, options]: Parameters<typeof goto>) => {
        if (account?.symbol) {
            analytics.report({
                type: EventType.AccountsActions,
                payload: { symbol: account.symbol, action: routeName },
            });
        }
        dispatch(goto(routeName, options));
    };

    const ITEMS: NavigationItem[] = [
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

    const ACTIONS: ActionItem[] = [
        {
            id: 'wallet-send',
            callback: () => {
                goToWithAnalytics('wallet-send', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_SEND" />,
            icon: 'SEND',
            isHidden: false,
        },
        {
            id: 'wallet-receive',
            callback: () => {
                goToWithAnalytics('wallet-receive', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_RECEIVE" />,
            icon: 'RECEIVE',
            isHidden: false,
        },
        {
            id: 'wallet-coinmarket-buy',
            callback: () => {
                goToWithAnalytics('wallet-coinmarket-buy', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_TRADE" />,
            icon: 'REFRESH',
            isHidden: ['coinjoin'].includes(accountType),
        },
        {
            id: 'wallet-add-token',
            callback: () => {
                if (account?.symbol) {
                    analytics.report({
                        type: EventType.AccountsActions,
                        payload: { symbol: account.symbol, action: 'add-token' },
                    });
                }
                dispatch(openModal({ type: 'add-token' }));
            },
            title: <Translation id="TR_TOKENS_ADD" />,
            extra: true,
            isHidden: !['ethereum'].includes(networkType),
        },
        {
            id: 'wallet-sign-verify',
            callback: () => {
                goToWithAnalytics('wallet-sign-verify', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_SIGN_AND_VERIFY" />,
            icon: 'SIGNATURE',
            extra: true,
            // show dots when acc missing as they are hidden only in case of XRP
            isHidden: !account ? false : !hasNetworkFeatures(account, 'sign-verify'),
        },
    ];

    // collect all items suitable for current networkType
    const items = ITEMS.filter(item => !item.isHidden).map(item => ({
        ...item,
        'data-test-id': `@wallet/menu/${item.id}${dataTestSuffix ? `-${dataTestSuffix}` : ''}`,
    }));

    return (
        <AppNavigation
            items={items}
            actions={ACTIONS}
            primaryContent={primaryContent}
            inView={inView}
        />
    );
};
