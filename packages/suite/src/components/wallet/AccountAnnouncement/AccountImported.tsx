import React from 'react';
import { NotificationCard, Translation } from '@suite-components';
import messages from '@suite/support/messages';

export default () => (
    <NotificationCard variant="info">
        <Translation {...messages.TR_ACCOUNT_IMPORTED_ANNOUNCEMENT} />
    </NotificationCard>
);
