import React from 'react';
import { Translation } from '@suite-components/Translation';
// import { NETWORKS } from '@wallet-config';
import { Account } from '@wallet-types';
import messages from '@suite/support/messages';

export const ITEMS = [
    {
        route: 'wallet-index',
        title: <Translation {...messages.TR_NAV_TRANSACTIONS} />,
        icon: 'TRANSACTIONS',
        isHidden: () => false,
    },
    {
        route: 'wallet-receive',
        title: <Translation {...messages.TR_NAV_RECEIVE} />,
        icon: 'RECEIVE',
        isHidden: () => false,
    },
    {
        route: 'wallet-send',
        title: <Translation {...messages.TR_NAV_SEND} />,
        icon: 'SEND',
        isHidden: () => false,
    },
    {
        route: 'wallet-details',
        title: <Translation {...messages.TR_NAV_DETAILS} />,
        icon: 'INFO',
        isHidden: (networkType: Account['networkType']) => networkType !== 'bitcoin',
    },
] as const;

export const HIDDEN_ITEMS = [
    // {
    //     route: 'wallet-sign-verify',
    //     title: <Translation {...messages.TR_NAV_SIGN_AND_VERIFY} />,
    //     icon: 'SIGN',
    //     isHidden: (networkType: string) => {
    //         const network = NETWORKS.find(c => c.symbol === networkType);
    //         return network ? !network.hasSignVerify : false;
    //     },
    // },
] as const;
