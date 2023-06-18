import React from 'react';
import { NotificationCard, Translation } from 'src/components/suite';
import type { Account } from 'src/types/wallet/index';

type AccountImportedProps = {
    account: Account | undefined;
};

export const AccountImported = ({ account }: AccountImportedProps) =>
    account?.imported ? (
        <NotificationCard variant="info">
            <Translation id="TR_ACCOUNT_IMPORTED_ANNOUNCEMENT" />
        </NotificationCard>
    ) : null;
