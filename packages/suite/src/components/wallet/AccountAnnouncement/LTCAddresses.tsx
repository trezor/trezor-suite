import React from 'react';
import { NotificationCard, Translation } from '@suite-components';
import { Link } from '@trezor/components';
import { URLS } from '@suite-constants';

const LTCAddresses = () => (
    <NotificationCard variant="info">
        <Translation
            id="TR_LTC_ADDRESS_INFO"
            values={{
                TR_LEARN_MORE: (
                    <Link variant="nostyle" href={URLS.LTC_ADDRESS_INFO_URL}>
                        <Translation id="TR_LEARN_MORE" />
                    </Link>
                ),
            }}
        />
    </NotificationCard>
);

export default LTCAddresses;
