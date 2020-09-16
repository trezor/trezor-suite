import React from 'react';
import { NotificationCard, Translation } from '@suite-components';
import { Link } from '@trezor/components';
import { URLS } from '@suite-constants';

const BCHAddresses = () => (
    <NotificationCard variant="info">
        <Translation
            id="TR_BCH_ADDRESS_INFO"
            values={{
                TR_LEARN_MORE: (
                    <Link variant="nostyle" href={URLS.BCH_ADDRESS_TOOL}>
                        <Translation id="TR_LEARN_MORE" />
                    </Link>
                ),
            }}
        />
    </NotificationCard>
);

export default BCHAddresses;
