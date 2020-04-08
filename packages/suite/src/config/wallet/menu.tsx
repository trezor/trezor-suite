import React from 'react';
import { Translation } from '@suite-components/Translation';
import { NETWORKS } from '@wallet-config';
import { Account } from '@wallet-types';

export const VISIBLE_ITEMS_LIMIT = 3;

export const ITEMS = [
    {
        route: 'wallet-index',
        title: <Translation id="TR_NAV_TRANSACTIONS" />,
        icon: 'TRANSACTIONS',
        isHidden: () => false,
    },
    {
        route: 'wallet-receive',
        title: <Translation id="TR_NAV_RECEIVE" />,
        icon: 'RECEIVE',
        isHidden: () => false,
    },
    {
        route: 'wallet-send',
        title: <Translation id="TR_NAV_SEND" />,
        icon: 'SEND',
        isHidden: () => false,
    },
    {
        route: 'wallet-details',
        title: <Translation id="TR_NAV_DETAILS" />,
        icon: 'INFO',
        isHidden: (account: Account) => account.networkType !== 'bitcoin',
    },
    {
        route: 'wallet-sign-verify',
        title: <Translation id="TR_NAV_SIGN_AND_VERIFY" />,
        icon: 'SIGN',
        isHidden: (account: Account) => {
            const network = NETWORKS.find(n => n.symbol === account.symbol);
            return !(network && network.testnet && network.hasSignVerify);
        },
    },
    {
        route: 'suite-index',
        title: <Translation id="TR_BUY" />,
        icon: 'PLUS',
        isHidden: (account: Account) => {
            const network = NETWORKS.find(n => n.symbol === account.symbol);
            return !(network && network.testnet);
        },
    },
] as const;
