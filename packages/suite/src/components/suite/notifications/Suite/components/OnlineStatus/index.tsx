/* @flow */
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Notification } from '@trezor/components';

import l10nMessages from './index.messages';

interface Props {
    isOnline: boolean;
}

export default ({ isOnline }: Props) => {
    if (isOnline) return null;
    return (
        <Notification
            key="wallet-offline"
            variant="error"
            title={<FormattedMessage {...l10nMessages.TR_YOU_WERE_DISCONNECTED_DOT} />}
            message={<FormattedMessage {...l10nMessages.TR_PLEASE_RELOAD_THE_PAGE_DOT} />}
        />
    );
};
