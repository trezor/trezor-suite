import React from 'react';
import { NotificationCard, Translation } from '@suite-components';
import type { Account } from '@wallet-types/index';

type AccountImportedProps = {
    account: Account | undefined;
};

export const AccountImported = ({ account }: AccountImportedProps) =>
    account?.imported ? (
        <NotificationCard variant="info">
            <Translation id="TR_ACCOUNT_IMPORTED_ANNOUNCEMENT" />
        </NotificationCard>
    ) : null;
