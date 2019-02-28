/* @flow */
import * as React from 'react';
import Notification from 'components/Notification';

import type { Props } from '../../index';
import l10nMessages from './index.messages';

export default (props: Props) => {
    const { online } = props.wallet;
    if (online) return null;
    return (
        <Notification
            key="wallet-offline"
            type="error"
            title={props.intl.formatMessage(l10nMessages.TR_YOU_WERE_DISCONNECTED_DOT)}
            message={props.intl.formatMessage(l10nMessages.TR_PLEASE_RELOAD_THE_PAGE_DOT)}
        />
    );
};