import { Banner } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';
import type { Account } from 'src/types/wallet/index';

type AccountOutOfSyncProps = {
    account: Account | undefined;
};

export const AccountOutOfSync = ({ account }: AccountOutOfSyncProps) =>
    account?.backendType === 'coinjoin' && account.status === 'out-of-sync' ? (
        <Banner intent="warning">
            <Translation id="TR_ACCOUNT_OUT_OF_SYNC" />
        </Banner>
    ) : null;
