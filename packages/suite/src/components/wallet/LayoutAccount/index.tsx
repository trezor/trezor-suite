import React from 'react';
import { FormattedMessage } from 'react-intl';
import TopNavigation from '@wallet-components/TopNavigation';
import Layout from '@wallet-components/Layout';
import { getRoute } from '@suite/utils/suite/router';
import NETWORKS from '@suite-config/networks';
import FLAGS from '@suite-config/flags';
import l10nMessages from './index.messages';

interface Props {
    children: React.ReactNode;
}

const LayoutAccount = (props: Props) => (
    <Layout
        topNavigationComponent={
            <TopNavigation
                items={[
                    {
                        route: getRoute('wallet-account-summary'),
                        title: <FormattedMessage {...l10nMessages.TR_NAV_SUMMARY} />,
                    },
                    {
                        route: getRoute('wallet-account-transactions'),
                        title: <FormattedMessage {...l10nMessages.TR_NAV_TRANSACTIONS} />,
                        isHidden: () => {
                            return !FLAGS.transactions;
                        },
                    },
                    {
                        route: getRoute('wallet-account-receive'),
                        title: <FormattedMessage {...l10nMessages.TR_NAV_RECEIVE} />,
                    },
                    {
                        route: getRoute('wallet-account-send'),
                        title: <FormattedMessage {...l10nMessages.TR_NAV_SEND} />,
                    },
                    {
                        route: getRoute('wallet-account-sign-verify'),
                        title: <FormattedMessage {...l10nMessages.TR_NAV_SIGN_AND_VERIFY} />,
                        isHidden: (coinShortcut: string) => {
                            const network = NETWORKS.find(c => c.shortcut === coinShortcut);
                            return network ? !network.hasSignVerify : false;
                        },
                    },
                ]}
            />
        }
    >
        {props.children}
    </Layout>
);

export default LayoutAccount;
