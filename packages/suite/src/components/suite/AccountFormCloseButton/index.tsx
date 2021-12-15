import React from 'react';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import { CloseButton } from '@suite-components';

const AccountFormCloseButton = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    return <CloseButton onClick={() => goto('wallet-index', undefined, true)} />;
};

export default AccountFormCloseButton;
