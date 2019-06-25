/* @flow */
import * as React from 'react';
import { injectIntl, InjectedIntlProps } from 'react-intl';
import { Notification } from '@trezor/components';
import l10nMessages from './index.messages';

// TODO
interface Props extends InjectedIntlProps {
    blockchain: any;
}
// There could be only one account notification
const AccountNotifications = (props: Props) => {
    // TODO
    const selectedAccount = {
        notification: null,
        network: {
            shortcut: 'xrp',
        },
    };
    // const { network, notification } = props.selectedAccount;
    const { network, notification } = selectedAccount;

    if (!network || !notification) return null;
    const blockchain = props.blockchain.find(b => b.shortcut === network.shortcut);

    if (notification.type === 'backend') {
        // special case: backend is down
        // TODO: this is a different component with "auto resolve" button
        return (
            <Notification
                variant="error"
                title={notification.title}
                message={notification.message}
                isActionInProgress={blockchain && blockchain.connecting}
                actions={[
                    {
                        label: props.intl.formatMessage(l10nMessages.TR_CONNECT_TO_BACKEND),
                        callback: () => {},
                        // callback: async () => {
                        //     await props.blockchainReconnect(network.shortcut);
                        // },
                    },
                ]}
            />
        );
    }
    return (
        <Notification
            variant={notification.variant}
            title={notification.title}
            message={notification.message}
        />
    );
};

export default injectIntl(AccountNotifications);
