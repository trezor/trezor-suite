import React from 'react';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';
import Wrapper from './components/Wrapper';

/**
 * Handler for invalid router params
 * see: @wallet-actions/selectedAccountActions
 */
const AccountNotExists = () => {
    return (
        <Wrapper
            title={<Translation {...messages.TR_ACCOUNT_EXCEPTION_NOT_EXIST} />}
            image={resolveStaticPath(`images/wallet/wallet-empty.svg`)}
        />
    );
};

export default AccountNotExists;
