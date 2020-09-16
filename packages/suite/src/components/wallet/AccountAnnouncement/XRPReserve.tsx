import React from 'react';
import { NotificationCard, Translation } from '@suite-components';
import { Link } from '@trezor/components';
import { URLS } from '@suite-constants';

import { formatNetworkAmount } from '@wallet-utils/accountUtils';

interface Props {
    reserve: string;
}

const XRPReserve = ({ reserve }: Props) => (
    <NotificationCard variant="info">
        <Translation
            id="TR_XRP_RESERVE_INFO"
            values={{
                minBalance: formatNetworkAmount(reserve, 'xrp'),
                TR_LEARN_MORE: (
                    <Link variant="nostyle" href={URLS.XRP_MANUAL_URL}>
                        <Translation id="TR_LEARN_MORE" />
                    </Link>
                ),
            }}
        />
    </NotificationCard>
);

export default XRPReserve;
