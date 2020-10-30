import React from 'react';
import { NotificationCard, Translation } from '@suite-components';
import { Link } from '@trezor/components';
import { BLOG_URL } from '@suite-constants/urls';

const BCHFork = () => (
    <NotificationCard
        variant="info"
        button={{
            children: (
                // TODO: URL to blog post
                <Link variant="nostyle" href={BLOG_URL}>
                    <Translation id="TR_LEARN_MORE" />
                </Link>
            ),
        }}
    >
        <Translation id="TR_BITCOIN_CASH_15_NOV_FORK" />
    </NotificationCard>
);

export default BCHFork;
