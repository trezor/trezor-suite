/* @flow */
import * as React from 'react';
import { Notification } from 'trezor-ui-components';
import l10nMessages from './index.messages';

import type { Props } from '../../index';

// There could be only one account notification
export default (props: Props) => {
    const { network, notification } = props.selectedAccount;
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
                        callback: async () => {
                            await props.blockchainReconnect(network.shortcut);
                        },
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
