import * as React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { Notification } from '@suite-components';
import { AppState } from '@suite-types';
import l10nMessages from './index.messages';
// TODO
interface Props extends WrappedComponentProps {
    blockchain: any;
    selectedAccount: AppState['wallet']['selectedAccount'];
}

interface Network {
    symbol: string;
}

// There could be only one account notification
const AccountNotifications = (props: Props) => {
    const { network, notification } = props.selectedAccount;

    if (!network || !notification) return null;
    const blockchain = props.blockchain.find((b: Network) => b.symbol === network.symbol);

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
                        //     await props.blockchainReconnect(network.symbol);
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
            actions={notification.actions}
        />
    );
};

export default injectIntl(AccountNotifications);
