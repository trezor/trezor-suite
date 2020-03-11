import React from 'react';
import { Translation, Image } from '@suite-components';

import Wrapper from './components/Wrapper';

/**
 * Handler for invalid router params
 * see: @wallet-actions/selectedAccountActions
 */
const AccountNotExists = () => {
    return (
        <Wrapper
            title={<Translation id="TR_ACCOUNT_EXCEPTION_NOT_EXIST" />}
            image={<Image image="EMPTY_WALLET" />}
        />
    );
};

export default AccountNotExists;
