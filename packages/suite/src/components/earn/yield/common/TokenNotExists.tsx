import { Translation } from '@suite/intl';

import { AccountExceptionLayout } from 'src/components/wallet';

export const TokenNotExists = () => (
    <AccountExceptionLayout
        title={<Translation id="TR_EARN_YIELD_TOKEN_NOT_EXIST" />}
        iconName="warning"
        iconVariant="neutral"
    />
);
