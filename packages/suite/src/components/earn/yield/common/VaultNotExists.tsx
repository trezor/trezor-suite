import { Translation } from '@suite/intl';

import { AccountExceptionLayout } from 'src/components/wallet';

export const VaultNotExists = () => (
    <AccountExceptionLayout
        title={<Translation id="TR_EARN_YIELD_VAULT_NOT_EXIST" />}
        iconName="warning"
        iconVariant="neutral"
    />
);
