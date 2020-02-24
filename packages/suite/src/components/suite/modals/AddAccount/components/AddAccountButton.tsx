import React from 'react';
import { Button, Tooltip } from '@trezor/components';
import { Account, Network } from '@wallet-types';

interface Props {
    network?: Network;
    accounts: Account[];
    onEnableAccount: (account: Account) => void;
}
const AddAccountButton = (props: Props) => {
    if (props.accounts.length === 0) return null;
    const account = props.accounts[props.accounts.length - 1];
    let enabled = true;
    let description = account.path;
    if (props.accounts.length > 1) {
        // prev account is empty, do not add another
        enabled = false;
        description = 'Previous account is empty';
    }
    if (account.index === 0 && account.empty && account.accountType === 'normal') {
        // current (first normal) account is empty, do not add another
        enabled = false;
        description = 'Previous account is empty';
    }
    if (account.index >= 10) {
        enabled = false;
        description = 'Account index is greater than 10';
    }

    // const accountType = getTypeForNetwork(props.network?.accountType || 'normal');

    const addButton = (
        <Button
            icon="PLUS"
            variant="primary"
            isDisabled={!enabled}
            onClick={() => props.onEnableAccount(account)}
        >
            Add account
        </Button>
    );

    if (!enabled) {
        return (
            <Tooltip maxWidth={285} placement="top" content={description}>
                {addButton}
            </Tooltip>
        );
    }
    return addButton;
};

export default AddAccountButton;
