import React from 'react';
import { NotificationCard, Translation } from '@suite-components';
import { Link } from '@trezor/components-v2';
import { URLS } from '@suite-constants';
import messages from '@suite/support/messages';

export default () => (
    <NotificationCard variant="info">
        <Translation
            {...messages.TR_LTC_ADDRESS_INFO}
            values={{
                TR_LEARN_MORE: (
                    <Link variant="nostyle" href={URLS.LTC_ADDRESS_INFO_URL}>
                        <Translation {...messages.TR_LEARN_MORE_LINK} />
                    </Link>
                ),
            }}
        />
    </NotificationCard>
);
