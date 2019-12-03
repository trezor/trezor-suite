import React from 'react';
import { Translation } from '@suite-components/Translation';
import { FLAGS } from '@suite-config';
import { NETWORKS } from '@wallet-config';
import messages from '@wallet-components/Menu/components/Row/components/AccountNavigation/index.messages';

export const ITEMS = [
    {
        route: 'wallet-account-transactions',
        title: <Translation>{messages.TR_NAV_TRANSACTIONS}</Translation>,
        icon: 'TRANSACTIONS',
        isHidden: () => {
            return !FLAGS.transactions;
        },
    },
    {
        route: 'wallet-account-receive',
        title: <Translation>{messages.TR_NAV_RECEIVE}</Translation>,
        icon: 'RECEIVE',
        isHidden: () => false,
    },
    {
        route: 'wallet-account-send',
        title: <Translation>{messages.TR_NAV_SEND}</Translation>,
        icon: 'SEND',
        isHidden: () => false,
    },
    {
        route: 'wallet-account-sign-verify',
        title: <Translation>{messages.TR_NAV_SIGN_AND_VERIFY}</Translation>,
        icon: 'SIGN',
        isHidden: (networkType: string) => {
            const network = NETWORKS.find(c => c.symbol === networkType);
            return network ? !network.hasSignVerify : false;
        },
    },
] as const;
