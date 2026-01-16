import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';

import type { Account } from 'src/types/wallet/index';

type AccountOutOfSyncProps = {
    account: Account | undefined;
};

export const AccountOutOfSync = ({ account }: AccountOutOfSyncProps) =>
    account?.backendType === 'coinjoin' && account.status === 'out-of-sync' ? (
        <Banner intent="warning" description={<Translation id="TR_ACCOUNT_OUT_OF_SYNC" />} />
    ) : null;
