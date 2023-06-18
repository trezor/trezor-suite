import React from 'react';
import { useActions } from 'src/hooks/suite';
import * as routerActions from 'src/actions/suite/routerActions';
import { CloseButton } from 'src/components/suite';

const AccountFormCloseButton = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    return (
        <CloseButton
            onClick={() => goto('wallet-index', { preserveParams: true })}
            data-test="@wallet/menu/close-button"
        />
    );
};

export default AccountFormCloseButton;
