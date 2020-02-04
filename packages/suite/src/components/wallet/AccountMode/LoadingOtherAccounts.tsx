import React from 'react';
import { NotificationCard, Translation } from '@suite-components';
import messages from '@suite/support/messages';

export default () => (
    <NotificationCard variant="loader">
        <Translation {...messages.TR_LOADING_OTHER_ACCOUNTS} />
    </NotificationCard>
);
