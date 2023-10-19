import { ReactNode } from 'react';
import { WalletParams } from 'src/types/wallet';
import { AppNavigation, AppNavigationItem } from 'src/components/suite/AppNavigation';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { getNetwork, hasNetworkFeatures } from '@suite-common/wallet-utils';
import { goto } from 'src/actions/suite/routerActions';
import { openModal } from 'src/actions/suite/modalActions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

interface AccountNavigationProps {
    filterPosition?: 'primary' | 'secondary';
    dataTestSuffix?: string;
    primaryContent?: ReactNode;
    inView?: boolean;
}

export const AccountNavigation = ({
    filterPosition,
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

    const ITEMS: AppNavigationItem[] = [
        {
            id: 'wallet-index',
            callback: () => {
                dispatch(goto('wallet-index', { preserveParams: true }));
            },
            title: <Translation id="TR_NAV_TRANSACTIONS" />,
            position: 'primary',
            isHidden: false,
        },
        {
            id: 'wallet-details',
            callback: () => {
                dispatch(goto('wallet-details', { preserveParams: true }));
            },
            title: <Translation id="TR_NAV_DETAILS" />,
            position: 'primary',
            isHidden: !['cardano', 'bitcoin', 'solana'].includes(networkType),
        },
        {
            id: 'wallet-tokens',
            callback: () => {
                dispatch(goto('wallet-tokens', { preserveParams: true }));
            },
            title: <Translation id="TR_NAV_TOKENS" />,
            position: 'primary',
            isHidden: !['cardano', 'ethereum', 'solana'].includes(networkType),
        },
        {
            id: 'wallet-staking',
            callback: () => {
                dispatch(goto('wallet-staking', { preserveParams: true }));
            },
            title: <Translation id="TR_NAV_STAKING" />,
            position: 'primary',
            isHidden: !hasNetworkFeatures(account, 'staking'),
        },
        {
            id: 'wallet-send',
            callback: () => {
                dispatch(goto('wallet-send', { preserveParams: true }));
            },
            title: <Translation id="TR_NAV_SEND" />,
            position: 'secondary',
            isHidden: false,
        },
        {
            id: 'wallet-receive',
            callback: () => {
                dispatch(goto('wallet-receive', { preserveParams: true }));
            },
            title: <Translation id="TR_NAV_RECEIVE" />,
            position: 'secondary',
            isHidden: false,
        },
        {
            id: 'wallet-coinmarket-buy',
            callback: () => {
                dispatch(goto('wallet-coinmarket-buy', { preserveParams: true }));
            },
            title: <Translation id="TR_NAV_TRADE" />,
            position: 'secondary',
            isHidden: ['coinjoin'].includes(accountType),
        },
        {
            id: 'wallet-add-token',
            callback: () => {
                dispatch(openModal({ type: 'add-token' }));
            },
            title: <Translation id="TR_TOKENS_ADD" />,
            position: 'secondary',
            extra: true,
            isHidden: !['ethereum'].includes(networkType),
        },
        {
            id: 'wallet-sign-verify',
            callback: () => {
                dispatch(goto('wallet-sign-verify', { preserveParams: true }));
            },
            title: <Translation id="TR_NAV_SIGN_AND_VERIFY" />,
            icon: 'SIGNATURE',
            position: 'secondary',
            extra: true,
            // show dots when acc missing as they are hidden only in case of XRP
            isHidden: !account ? false : !hasNetworkFeatures(account, 'sign-verify'),
        },
    ];

    // collect all items suitable for current networkType
    let items = ITEMS.filter(item => !item.isHidden).map(item => ({
        ...item,
        'data-test': `@wallet/menu/${item.id}${dataTestSuffix ? `-${dataTestSuffix}` : ''}`,
    }));

    if (filterPosition) {
        items = items.filter(item => item.position === filterPosition);
    }

    return <AppNavigation items={items} primaryContent={primaryContent} inView={inView} />;
};
