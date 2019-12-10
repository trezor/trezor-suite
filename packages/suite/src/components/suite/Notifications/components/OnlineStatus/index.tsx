import * as React from 'react';
import { Translation } from '@suite-components/Translation';
import { Notification } from '@trezor/components';

import messages from '@suite/support/messages';

interface Props {
    isOnline: boolean;
}

export default ({ isOnline }: Props) => {
    if (isOnline) return null;
    return (
        <Notification
            key="wallet-offline"
            variant="error"
            title={<Translation {...messages.TR_YOU_WERE_DISCONNECTED_DOT} />}
            message={<Translation {...messages.TR_PLEASE_RELOAD_THE_PAGE_DOT} />}
        />
    );
};
