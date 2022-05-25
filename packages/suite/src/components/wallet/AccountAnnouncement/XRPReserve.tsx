import React from 'react';
import { NotificationCard, Translation, ReadMoreLink } from '@suite-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';

interface Props {
    reserve: string;
}

const XRPReserve = ({ reserve }: Props) => (
    <NotificationCard
        variant="info"
        button={{
            children: <ReadMoreLink url="WIKI_XRP_URL" />,
        }}
    >
        <Translation
            id="TR_XRP_RESERVE_INFO"
            values={{
                minBalance: formatNetworkAmount(reserve, 'xrp'),
            }}
        />
    </NotificationCard>
);

export default XRPReserve;
