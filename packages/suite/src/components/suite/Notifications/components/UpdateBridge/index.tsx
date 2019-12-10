import messages from '@suite/support/messages';
import { Notification } from '@trezor/components';
import React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';

import { Props as BaseProps } from '../../index';

interface Props {
    transport: BaseProps['suite']['transport'];
    goto: BaseProps['goto'];
}

const UpdateBridge = ({ transport, intl, goto }: Props & WrappedComponentProps) => {
    if (transport && transport.outdated) {
        return (
            <Notification
                key="update-bridge"
                variant="warning"
                title={intl.formatMessage(messages.TR_NEW_TREZOR_BRIDGE_IS_AVAILABLE)}
                message={intl.formatMessage(messages.TR_UPGRADE_FOR_THE_NEWEST_FEATURES_DOT)}
                actions={[
                    {
                        label: intl.formatMessage(messages.TR_SHOW_DETAILS),
                        callback: () => goto('suite-bridge'),
                    },
                ]}
            />
        );
    }
    return null;
};

export default injectIntl(UpdateBridge);
