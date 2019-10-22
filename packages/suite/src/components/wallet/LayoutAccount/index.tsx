import React from 'react';
import { Translation } from '@suite-components/Intl';
import TopNavigation from '@wallet-components/TopNavigation';
import WalletLayout from '@wallet-components/WalletLayout';
import { FLAGS } from '@suite-config';
import { NETWORKS } from '@wallet-config';
import l10nMessages from './index.messages';

interface Props {
    children: React.ReactNode;
    title: string;
}

const LayoutAccount = (props: Props) => (
    <WalletLayout
        title={props.title}
        topNavigationComponent={
            <TopNavigation
                items={[
                    {
                        route: 'wallet-account-summary',
                        title: <Translation>{l10nMessages.TR_NAV_SUMMARY}</Translation>,
                    },
                    {
                        route: 'wallet-account-transactions',
                        title: <Translation>{l10nMessages.TR_NAV_TRANSACTIONS}</Translation>,
                        isHidden: () => {
                            return !FLAGS.transactions;
                        },
                    },
                    {
                        route: 'wallet-account-receive',
                        title: <Translation>{l10nMessages.TR_NAV_RECEIVE}</Translation>,
                    },
                    {
                        route: 'wallet-account-send',
                        title: <Translation>{l10nMessages.TR_NAV_SEND}</Translation>,
                    },
                    {
                        route: 'wallet-account-sign-verify',
                        title: <Translation>{l10nMessages.TR_NAV_SIGN_AND_VERIFY}</Translation>,
                        isHidden: (networkType: string) => {
                            const network = NETWORKS.find(c => c.symbol === networkType);
                            return network ? !network.hasSignVerify : false;
                        },
                    },
                ]}
            />
        }
    >
        {props.children}
    </WalletLayout>
);

export default LayoutAccount;
