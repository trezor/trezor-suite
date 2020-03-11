import React from 'react';
import { Button, Tooltip } from '@trezor/components';
import { Account, Network } from '@wallet-types';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';

interface Props {
    network: Network;
    accounts: Account[];
    onEnableAccount: (account: Account) => void;
}

export default (props: Props) => {
    if (props.accounts.length === 0) return null;
    const account = props.accounts[props.accounts.length - 1];
    let tooltip;
    if (props.accounts.length > 1) {
        // prev account is empty, do not add another
        tooltip = <Translation {...messages.MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY} />;
    }
    if (account.index === 0 && account.empty && account.accountType === 'normal') {
        // current (first normal) account is empty, do not add another
        tooltip = <Translation {...messages.MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY} />;
    }
    if (account.index >= 10) {
        tooltip = <Translation {...messages.MODAL_ADD_ACCOUNT_LIMIT_EXCEEDED} />;
    }

    const addButton = (
        <Button
            icon="PLUS"
            variant="primary"
            isDisabled={!!tooltip}
            onClick={() => props.onEnableAccount(account)}
        >
            <Translation {...messages.TR_ADD_ACCOUNT} />
        </Button>
    );

    if (tooltip) {
        return (
            <Tooltip maxWidth={285} placement="top" content={tooltip}>
                {addButton}
            </Tooltip>
        );
    }
    return addButton;
};
