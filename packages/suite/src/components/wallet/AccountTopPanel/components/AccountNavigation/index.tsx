import React from 'react';
import { Account } from '@wallet-types';
import { AppNavigation, AppNavigationItem } from '@suite-components/AppNavigation';
import { Translation } from '@suite-components/Translation';
import { useActions, useSelector } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import * as modalActions from '@suite-actions/modalActions';
import { hasNetworkFeatures } from '@wallet-utils/accountUtils';
import { Dot } from './components/Dot';

interface AccountNavigationProps {
    account?: Account;
    filterPosition?: 'primary' | 'secondary';
    dataTestSuffix?: string;
    primaryContent?: React.ReactNode;
    inView?: boolean;
}

export const AccountNavigation = ({
    account,
    filterPosition,
    dataTestSuffix,
    primaryContent,
    inView,
}: AccountNavigationProps) => {
    let showStakingStatus;
    const { goto, openModal } = useActions({
        goto: routerActions.goto,
        openModal: modalActions.openModal,
    });
    const { trezorPools, isFetchLoading } = useSelector(state => ({
        trezorPools: state.wallet.cardanoStaking.trezorPools,
        isFetchLoading: state.wallet.cardanoStaking.isFetchLoading,
    }));

    if (account && account.networkType === 'cardano') {
        const { poolId } = account.misc.staking;
        const currentPool =
            poolId && trezorPools ? trezorPools?.pools.find(p => p.bech32 === poolId) : null;
        const isStakingOnTrezorPool = !isFetchLoading ? !!currentPool : true;

        showStakingStatus = !account.misc.staking.isActive || !isStakingOnTrezorPool;
    }

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
            isHidden: !account ? false : !['cardano', 'bitcoin'].includes(account.networkType),
        },
        {
            id: 'wallet-tokens',
            callback: () => {
                goto('wallet-tokens', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_TOKENS" />,
            position: 'primary',
            isHidden: !account ? false : !['cardano', 'ethereum'].includes(account.networkType),
        },
        {
            id: 'wallet-staking',
            callback: () => {
                goto('wallet-staking', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_STAKING" />,
            position: 'primary',
            isHidden: !account ? false : !['cardano'].includes(account.networkType),
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
            isHidden: false,
        },
        {
            id: 'wallet-add-token',
            callback: () => {
                openModal({ type: 'add-token' });
            },
            title: <Translation id="TR_TOKENS_ADD" />,
            position: 'secondary',
            extra: true,
            isHidden: account?.networkType !== 'ethereum',
        },
        {
            id: 'wallet-sign-verify',
            callback: () => {
                goto('wallet-sign-verify', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_SIGN_AND_VERIFY" />,
            icon: 'SIGN',
            position: 'secondary',
            extra: true,
            isHidden: !account || !hasNetworkFeatures(account, 'sign-verify'),
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
