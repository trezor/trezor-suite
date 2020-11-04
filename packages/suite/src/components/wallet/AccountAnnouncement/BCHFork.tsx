import React from 'react';
import { NotificationCard, Translation } from '@suite-components';
import { Link } from '@trezor/components';
import { BCH_FORK_BLOG_POST } from '@suite-constants/urls';

const BCHFork = () => (
    <NotificationCard
        variant="info"
        button={{
            children: (
                <Link variant="nostyle" href={BCH_FORK_BLOG_POST}>
                    <Translation id="TR_LEARN_MORE" />
                </Link>
            ),
        }}
    >
        <Translation id="TR_BITCOIN_CASH_15_NOV_FORK" />
    </NotificationCard>
);

export default BCHFork;
