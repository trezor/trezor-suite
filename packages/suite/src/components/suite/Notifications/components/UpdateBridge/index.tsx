import React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { Notification } from '@trezor/components';

import l10nCommonMessages from '@suite-views/index.messages';
import l10nMessages from './index.messages';
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
                title={intl.formatMessage(l10nMessages.TR_NEW_TREZOR_BRIDGE_IS_AVAILABLE)}
                message={intl.formatMessage(
                    l10nCommonMessages.TR_UPGRADE_FOR_THE_NEWEST_FEATURES_DOT,
                )}
                actions={[
                    {
                        label: intl.formatMessage(l10nCommonMessages.TR_SHOW_DETAILS),
                        callback: () => goto('suite-bridge'),
                    },
                ]}
            />
        );
    }
    return null;
};

export default injectIntl(UpdateBridge);
