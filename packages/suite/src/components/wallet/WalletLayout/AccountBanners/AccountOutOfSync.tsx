import { Translation } from '@suite/intl';
import type { Account } from '@suite-common/wallet-types';
import { Banner } from '@trezor/components';

type AccountOutOfSyncProps = {
    account: Account | undefined;
};

export const AccountOutOfSync = ({ account }: AccountOutOfSyncProps) =>
    account?.backendType === 'coinjoin' && account.status === 'out-of-sync' ? (
        <Banner intent="warning" description={<Translation id="TR_ACCOUNT_OUT_OF_SYNC" />} />
    ) : null;
