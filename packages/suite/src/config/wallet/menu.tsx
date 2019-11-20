import React from 'react';
import { Translation } from '@suite-components/Intl';
import { FLAGS } from '@suite-config';
import { NETWORKS } from '@wallet-config';
import messages from '@wallet-components/Menu/components/Row/components/AccountNavigation/index.messages';

export const items = [
    {
        route: 'wallet-account-transactions',
        title: <Translation>{messages.TR_NAV_TRANSACTIONS}</Translation>,
        isHidden: () => {
            return !FLAGS.transactions;
        },
    },
    {
        route: 'wallet-account-summary',
        title: <Translation>{messages.TR_NAV_SUMMARY}</Translation>,
        isHidden: () => {},
    },
    {
        route: 'wallet-account-receive',
        title: <Translation>{messages.TR_NAV_RECEIVE}</Translation>,
        isHidden: () => {},
    },
    {
        route: 'wallet-account-send',
        title: <Translation>{messages.TR_NAV_SEND}</Translation>,
        isHidden: () => {},
    },
    {
        route: 'wallet-account-sign-verify',
        title: <Translation>{messages.TR_NAV_SIGN_AND_VERIFY}</Translation>,
        isHidden: (networkType: string) => {
            const network = NETWORKS.find(c => c.symbol === networkType);
            return network ? !network.hasSignVerify : false;
        },
    },
] as const;
