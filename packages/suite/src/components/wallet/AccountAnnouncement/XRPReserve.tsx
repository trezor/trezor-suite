import React from 'react';
import { NotificationCard, Translation } from '@suite-components';
import { Link } from '@trezor/components-v2';
import { URLS } from '@suite-constants';
import messages from '@suite/support/messages';

interface Props {
    reserve: string;
}

export default ({ reserve }: Props) => (
    <NotificationCard variant="info">
        <Translation
            {...messages.TR_XRP_RESERVE_INFO}
            values={{
                minBalance: reserve,
                TR_LEARN_MORE: (
                    <Link variant="nostyle" href={URLS.XRP_MANUAL_URL}>
                        <Translation {...messages.TR_LEARN_MORE_LINK} />
                    </Link>
                ),
            }}
        />
    </NotificationCard>
);
