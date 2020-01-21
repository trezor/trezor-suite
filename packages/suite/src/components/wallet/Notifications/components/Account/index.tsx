import * as React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { Notification } from '@suite-components';
import AuthConfirm from '@suite-components/Notifications/components/AuthConfirm';
import { Props as BaseProps } from '@wallet-components/Notifications';
import messages from '@suite/support/messages';

type Props = WrappedComponentProps & BaseProps;

// There could be only one account notification
const AccountNotifications = (props: Props) => {
    if (props.selectedAccount.status !== 'loaded') return null;
    const { notification } = props.selectedAccount;
    if (!notification) return null;

    if (notification.type === 'auth') {
        // special case: passphrase confirmation failed
        return <AuthConfirm />;
    }

    if (notification.type === 'backend') {
        // special case: backend is down
        // TODO: this is a different component with "auto resolve" button
        // const blockchain = props.blockchain[network.symbol];
        return (
            <Notification
                variant="error"
                title={notification.title}
                message={notification.message}
                // isActionInProgress={blockchain && blockchain.connecting}
                actions={[
                    {
                        label: props.intl.formatMessage(messages.TR_CONNECT_TO_BACKEND),
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
