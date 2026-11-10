import { Translation } from '@suite/intl';
import type { Account } from '@suite-common/wallet-types';
import { Banner } from '@trezor/components';

type AccountImportedProps = {
    account: Account | undefined;
};

export const AccountImported = ({ account }: AccountImportedProps) =>
    account?.imported ? (
        <Banner intent="info" description={<Translation id="TR_ACCOUNT_IMPORTED_ANNOUNCEMENT" />} />
    ) : null;
