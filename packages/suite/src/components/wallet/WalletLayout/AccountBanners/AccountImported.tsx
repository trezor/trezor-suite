import { Translation } from '@suite/intl';
import { isAccountWatchOnly } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';

import type { Account } from 'src/types/wallet/index';

type AccountImportedProps = {
    account: Account | undefined;
};

export const AccountImported = ({ account }: AccountImportedProps) => {
    if (!account?.imported) {
        return null;
    }

    const translationId = isAccountWatchOnly(account)
        ? 'TR_ACCOUNT_WATCH_ONLY_ANNOUNCEMENT'
        : 'TR_ACCOUNT_IMPORTED_ANNOUNCEMENT';

    return <Banner intent="info" description={<Translation id={translationId} />} />;
};
