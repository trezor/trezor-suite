import React from 'react';
import { FormattedMessage } from 'react-intl';
import TopNavigation from '@wallet-components/TopNavigation';
import WalletLayout from '@wallet-components/WalletLayout';
import { FLAGS } from '@suite-config';
import { NETWORKS } from '@wallet-config';
import l10nMessages from './index.messages';

interface Props {
    children: React.ReactNode;
    isTransaction?: boolean;
}

const LayoutAccount = (props: Props) => (
    <WalletLayout
        topNavigationComponent={
            <TopNavigation
                items={[
                    {
                        route: 'wallet-account-summary',
                        title: <FormattedMessage {...l10nMessages.TR_NAV_SUMMARY} />,
                    },
                    {
                        route: 'wallet-account-transactions',
                        title: <FormattedMessage {...l10nMessages.TR_NAV_TRANSACTIONS} />,
                        isHidden: () => {
                            return !FLAGS.transactions;
                        },
                    },
                    {
                        route: 'wallet-account-receive',
                        title: <FormattedMessage {...l10nMessages.TR_NAV_RECEIVE} />,
                    },
                    {
                        route: 'wallet-account-send',
                        title: <FormattedMessage {...l10nMessages.TR_NAV_SEND} />,
                    },
                    {
                        route: 'wallet-account-sign-verify',
                        title: <FormattedMessage {...l10nMessages.TR_NAV_SIGN_AND_VERIFY} />,
                        isHidden: (networkType: string) => {
                            const network = NETWORKS.find(c => c.symbol === networkType);
                            return network ? !network.hasSignVerify : false;
                        },
                    },
                ]}
            />
        }
        {...(props.isTransaction ? { isTransaction: true } : {})}
    >
        {props.children}
    </WalletLayout>
);

export default LayoutAccount;
