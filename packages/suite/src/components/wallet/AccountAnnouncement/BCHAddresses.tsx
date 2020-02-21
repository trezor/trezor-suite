import React from 'react';
import { NotificationCard, Translation } from '@suite-components';
import { Link } from '@trezor/components';
import { URLS } from '@suite-constants';
import messages from '@suite/support/messages';

export default () => (
    <NotificationCard variant="info">
        <Translation
            {...messages.TR_BCH_ADDRESS_INFO}
            values={{
                TR_LEARN_MORE: (
                    <Link variant="nostyle" href={URLS.BCH_ADDRESS_TOOL}>
                        <Translation {...messages.TR_LEARN_MORE_LINK} />
                    </Link>
                ),
            }}
        />
    </NotificationCard>
);
