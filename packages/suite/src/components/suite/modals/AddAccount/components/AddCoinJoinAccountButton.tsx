import React from 'react';
import { Translation } from '@suite-components';
import { useSelector, useActions } from '@suite-hooks';
import { createCoinjoinAccount } from '@wallet-actions/coinjoinAccountActions';
import type { Network } from '@wallet-types';
import { AddButton } from './AddButton';

interface AddCoinJoinAccountProps {
    network: Network;
}

export const AddCoinJoinAccountButton = ({ network }: AddCoinJoinAccountProps) => {
    const action = useActions({ createCoinjoinAccount });
    const { device, accounts } = useSelector(state => ({
        device: state.suite.device,
        accounts: state.wallet.accounts,
    }));

    const coinjoinAccounts = accounts.filter(
        a =>
            a.deviceState === device?.state &&
            a.symbol === network.symbol &&
            a.accountType === network.accountType,
    );

    // TODO: more disabled button states
    // no-capability, device connected etc

    const isDisabled = coinjoinAccounts.length > 0;
    return (
        <AddButton
            disabledMessage={
                isDisabled ? <Translation id="MODAL_ADD_ACCOUNT_LIMIT_EXCEEDED" /> : null
            }
            handleClick={() => action.createCoinjoinAccount(network)}
        />
    );
};
