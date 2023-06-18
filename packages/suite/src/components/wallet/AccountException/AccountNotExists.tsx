import React from 'react';
import { Translation } from 'src/components/suite';
import { AccountExceptionLayout } from 'src/components/wallet';

/**
 * Handler for invalid router params
 * see: @wallet-actions/selectedAccountActions
 */
const AccountNotExists = () => (
    <AccountExceptionLayout
        title={<Translation id="TR_ACCOUNT_EXCEPTION_NOT_EXIST" />}
        image="CLOUDY"
    />
);

export default AccountNotExists;
