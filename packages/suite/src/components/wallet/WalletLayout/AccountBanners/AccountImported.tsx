import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';

import type { Account } from 'src/types/wallet/index';

type AccountImportedProps = {
    account: Account | undefined;
};

export const AccountImported = ({ account }: AccountImportedProps) =>
    account?.imported ? (
        <Banner intent="info" description={<Translation id="TR_ACCOUNT_IMPORTED_ANNOUNCEMENT" />} />
    ) : null;
