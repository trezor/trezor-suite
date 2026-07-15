import { Translation } from '@suite/intl';
import { CloudIcon } from '@trezor/icons';

import { AccountExceptionLayout } from 'src/components/wallet';

/**
 * Handler for invalid router params
 * see: @wallet-actions/selectedAccountActions
 */
export const AccountNotExists = () => (
    <AccountExceptionLayout
        title={<Translation id="TR_ACCOUNT_EXCEPTION_NOT_EXIST" />}
        icon={CloudIcon}
        iconVariant="neutral"
    />
);
