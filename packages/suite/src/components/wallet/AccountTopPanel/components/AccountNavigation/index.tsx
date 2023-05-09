import React from 'react';
import { Account, WalletParams } from '@wallet-types';
import { AppNavigation, AppNavigationItem } from '@suite-components/AppNavigation';
import { Translation } from '@suite-components/Translation';
import { useActions, useSelector } from '@suite-hooks';
import { getNetwork, getNetworkFeatures } from '@suite-common/wallet-utils';
import * as routerActions from '@suite-actions/routerActions';
import * as modalActions from '@suite-actions/modalActions';
import { Dot } from './components/Dot';

interface AccountNavigationProps {
    filterPosition?: 'primary' | 'secondary';
    dataTestSuffix?: string;
    primaryContent?: React.ReactNode;
    inView?: boolean;
}

const useStakingStatus = (account?: Account) => {
    const cardanoNetwork = account && account.symbol === 'ada' ? 'mainnet' : 'preview';
    const { trezorPools, isFetchLoading } = useSelector(
        state => state.wallet.cardanoStaking[cardanoNetwork],
    );

    if (!account?.misc || !('staking' in account?.misc)) return false;

    const { poolId } = account.misc.staking;
    const currentPool =
        poolId && trezorPools ? trezorPools?.pools.find(p => p.bech32 === poolId) : null;
    const isStakingOnTrezorPool = !isFetchLoading ? !!currentPool : true;

    return !account.misc.staking.isActive || !isStakingOnTrezorPool;
};

export const AccountNavigation = ({
    filterPosition,
    dataTestSuffix,
    primaryContent,
    inView,
}: AccountNavigationProps) => {
    const { goto, openModal } = useActions({
        goto: routerActions.goto,
        openModal: modalActions.openModal,
    });

    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const { account } = selectedAccount;
    const showStakingStatus = useStakingStatus(account);
    const routerParams = useSelector(state => state.router.params) as WalletParams;
    const network = getNetwork(routerParams?.symbol || '');
    const networkType = account?.networkType || network?.networkType || 'bitcoin';
    const accountType = account?.accountType || routerParams?.accountType || 'normal';
    const symbol = account?.symbol || routerParams?.symbol || 'btc';
    const networkFeatures = getNetworkFeatures({ networkType, symbol, accountType });

    const ITEMS: AppNavigationItem[] = [
        {
            id: 'wallet-index',
            callback: () => {
                goto('wallet-index', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_TRANSACTIONS" />,
            position: 'primary',
            isHidden: false,
        },
        {
            id: 'wallet-details',
            callback: () => {
                goto('wallet-details', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_DETAILS" />,
            position: 'primary',
            isHidden: !['cardano', 'bitcoin'].includes(networkType),
        },
        {
            id: 'wallet-tokens',
            callback: () => {
                goto('wallet-tokens', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_TOKENS" />,
            position: 'primary',
            isHidden: !['cardano', 'ethereum'].includes(networkType),
        },
        {
            id: 'wallet-staking',
            callback: () => {
                goto('wallet-staking', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_STAKING" />,
            position: 'primary',
            isHidden: !networkFeatures?.includes('staking'),
            rightContent: showStakingStatus ? <Dot /> : undefined,
        },
        {
            id: 'wallet-send',
            callback: () => {
                goto('wallet-send', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_SEND" />,
            position: 'secondary',
            isHidden: false,
        },
        {
            id: 'wallet-receive',
            callback: () => {
                goto('wallet-receive', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_RECEIVE" />,
            position: 'secondary',
            isHidden: false,
        },
        {
            id: 'wallet-coinmarket-buy',
            callback: () => {
                goto('wallet-coinmarket-buy', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_TRADE" />,
            position: 'secondary',
            isHidden: ['coinjoin'].includes(accountType),
        },
        {
            id: 'wallet-add-token',
            callback: () => {
                openModal({ type: 'add-token' });
            },
            title: <Translation id="TR_TOKENS_ADD" />,
            position: 'secondary',
            extra: true,
            isHidden: !['ethereum'].includes(networkType),
        },
        {
            id: 'wallet-sign-verify',
            callback: () => {
                goto('wallet-sign-verify', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_SIGN_AND_VERIFY" />,
            icon: 'SIGNATURE',
            position: 'secondary',
            extra: true,
            isHidden: !networkFeatures?.includes('sign-verify'),
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
