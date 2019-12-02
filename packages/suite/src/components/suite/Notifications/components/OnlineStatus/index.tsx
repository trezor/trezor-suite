import * as React from 'react';
import { Translation } from '@suite-components/Translation';
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
            title={<Translation {...l10nMessages.TR_YOU_WERE_DISCONNECTED_DOT} />}
            message={<Translation {...l10nMessages.TR_PLEASE_RELOAD_THE_PAGE_DOT} />}
        />
    );
};
