import React from 'react';
import { Account } from '@wallet-types';
import AppNavigation, { AppNavigationItem } from '@suite-components/AppNavigation';
import { Translation } from '@suite-components/Translation';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import * as modalActions from '@suite-actions/modalActions';
import { hasSignVerify } from '@wallet-utils/accountUtils';

interface Props {
    account?: Account;
    filterPosition?: 'primary' | 'secondary';
    dataTestSuffix?: string;
    primaryContent?: React.ReactNode;
    inView?: boolean;
}

const AccountNavigation = (props: Props) => {
    const { account } = props;
    const { goto, openModal } = useActions({
        goto: routerActions.goto,
        openModal: modalActions.openModal,
    });

    const ITEMS: AppNavigationItem[] = [
        {
            id: 'wallet-index',
            callback: () => {
                goto('wallet-index', undefined, true);
            },
            title: <Translation id="TR_NAV_TRANSACTIONS" />,
            position: 'primary',
            isHidden: () => false,
        },
        {
            id: 'wallet-details',
            callback: () => {
                goto('wallet-details', undefined, true);
            },
            title: <Translation id="TR_NAV_DETAILS" />,
            position: 'primary',
            isHidden: () => account?.networkType !== 'bitcoin',
        },
        {
            id: 'wallet-tokens',
            callback: () => {
                goto('wallet-tokens', undefined, true);
            },
            title: <Translation id="TR_NAV_TOKENS" />,
            position: 'primary',
            isHidden: () => account?.networkType !== 'ethereum',
        },
        {
            id: 'wallet-send',
            callback: () => {
                goto('wallet-send', undefined, true);
            },
            title: <Translation id="TR_NAV_SEND" />,
            position: 'secondary',
            isHidden: () => false,
        },
        {
            id: 'wallet-receive',
            callback: () => {
                goto('wallet-receive', undefined, true);
            },
            title: <Translation id="TR_NAV_RECEIVE" />,
            position: 'secondary',
            isHidden: () => false,
        },
        {
            id: 'wallet-coinmarket-buy',
            callback: () => {
                goto('wallet-coinmarket-buy', undefined, true);
            },
            title: <Translation id="TR_NAV_TRADE" />,
            position: 'secondary',
            isHidden: () => false,
        },
        {
            id: 'wallet-add-token',
            callback: () => {
                openModal({ type: 'add-token' });
            },
            title: <Translation id="TR_TOKENS_ADD" />,
            position: 'secondary',
            extra: true,
            isHidden: () => account?.networkType !== 'ethereum',
        },
        {
            id: 'wallet-sign-verify',
            callback: () => {
                goto('wallet-sign-verify', undefined, true);
            },
            title: <Translation id="TR_NAV_SIGN_AND_VERIFY" />,
            icon: 'SIGN',
            position: 'secondary',
            extra: true,
            isHidden: () => !account || !hasSignVerify(account),
        },
    ];

    // collect all items suitable for current networkType
    let items = ITEMS.filter(item => item.isHidden && !item.isHidden()).map(item => ({
        ...item,
        'data-test': `@wallet/menu/${item.id}${
            props.dataTestSuffix ? `-${props.dataTestSuffix}` : ''
        }`,
    }));

    if (props.filterPosition) {
        items = items.filter(item => item.position === props.filterPosition);
    }

    return (
        <AppNavigation items={items} primaryContent={props.primaryContent} inView={props.inView} />
    );
};

export default AccountNavigation;
