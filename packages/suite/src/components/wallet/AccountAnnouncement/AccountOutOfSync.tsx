import React from 'react';
import { NotificationCard, Translation } from '@suite-components';
import type { Account } from '@wallet-types/index';

type AccountOutOfSyncProps = {
    account: Account | undefined;
};

const AccountOutOfSync = ({ account }: AccountOutOfSyncProps) =>
    account?.backendType === 'coinjoin' && account.status === 'out-of-sync' ? (
        <NotificationCard variant="warning">
            <Translation id="TR_ACCOUNT_OUT_OF_SYNC" />
        </NotificationCard>
    ) : null;

export default AccountOutOfSync;
