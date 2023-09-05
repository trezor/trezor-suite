import { NotificationCard, Translation } from 'src/components/suite';
import type { Account } from 'src/types/wallet/index';

type AccountOutOfSyncProps = {
    account: Account | undefined;
};

export const AccountOutOfSync = ({ account }: AccountOutOfSyncProps) =>
    account?.backendType === 'coinjoin' && account.status === 'out-of-sync' ? (
        <NotificationCard variant="warning">
            <Translation id="TR_ACCOUNT_OUT_OF_SYNC" />
        </NotificationCard>
    ) : null;
