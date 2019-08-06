import React from 'react';
import { injectIntl, InjectedIntlProps } from 'react-intl';
import { Notification } from '@trezor/components';
import { AppState } from '@suite-types';
import { goto } from '@suite-actions/routerActions';
import { getRoute } from '@suite-utils/router';

import l10nCommonMessages from '@suite-views/index.messages';
import l10nMessages from './index.messages';

interface Props {
    transport: AppState['suite']['transport'];
}

const UpdateBridge = ({ transport, intl }: Props & InjectedIntlProps) => {
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
                        callback: () => goto(getRoute('suite-bridge')),
                    },
                ]}
            />
        );
    }
    return null;
};

export default injectIntl(UpdateBridge);
