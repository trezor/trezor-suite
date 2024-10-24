import { Translation } from 'src/components/suite';
import { AccountExceptionLayout } from 'src/components/wallet';

/**
 * Handler for invalid router params
 * see: @wallet-actions/selectedAccountActions
 */
export const AccountNotExists = () => (
    <AccountExceptionLayout
        title={<Translation id="TR_ACCOUNT_EXCEPTION_NOT_EXIST" />}
        iconName="cloud"
        iconVariant="tertiary"
    />
);
