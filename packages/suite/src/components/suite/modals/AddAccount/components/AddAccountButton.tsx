import React, { useCallback } from 'react';
import { analytics, EventType } from '@trezor/suite-analytics';
import { Account, Network } from '@wallet-types';
import { Translation } from '@suite-components';
import { AddCoinJoinAccountButton } from './AddCoinJoinAccountButton';
import { AddButton } from './AddButton';
import { useAccountSearch } from '@suite-hooks';

const verifyAvailability = ({
    emptyAccounts,
    account,
}: {
    emptyAccounts: Account[];
    account: Account;
}) => {
    if (!account) {
        // discovery failed?
        return <Translation id="MODAL_ADD_ACCOUNT_NO_ACCOUNT" />;
    }
    if (emptyAccounts.length === 0) {
        return <Translation id="MODAL_ADD_ACCOUNT_NO_EMPTY_ACCOUNT" />;
    }
    if (emptyAccounts.length > 1) {
        // prev account is empty, do not add another
        return <Translation id="MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY" />;
    }
    if (account.index === 0 && account.empty && account.accountType === 'normal') {
        // current (first normal) account is empty, do not add another
        return <Translation id="MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY" />;
    }
    if (account.index >= 10) {
        return <Translation id="MODAL_ADD_ACCOUNT_LIMIT_EXCEEDED" />;
    }
};

interface AddAccountButtonProps {
    network: Network;
    emptyAccounts: Account[];
    onEnableAccount: (account: Account) => void;
}

const AddDefaultAccountButton = ({
    emptyAccounts,
    onEnableAccount,
}: Omit<AddAccountButtonProps, 'network'>) => {
    const account = emptyAccounts[emptyAccounts.length - 1];

    const disabledMessage = verifyAvailability({ emptyAccounts, account });

    const { setCoinFilter, setSearchString, coinFilter } = useAccountSearch();

    const handleClick = useCallback(() => {
        const { accountType: type, path, symbol } = account;
        onEnableAccount(account);
        // reset search string in account search box
        setSearchString(undefined);
        if (coinFilter && coinFilter !== symbol) {
            // if coinFilter is active then reset it only if added account doesn't belong to selected/filtered coin
            setCoinFilter(undefined);
        }
        // just to log that account was added manually.
        analytics.report({
            type: EventType.AccountsNewAccount,
            payload: {
                type,
                path,
                symbol,
            },
        });
    }, [account, onEnableAccount, setSearchString, setCoinFilter, coinFilter]);

    return <AddButton disabledMessage={disabledMessage} handleClick={handleClick} />;
};

export const AddAccountButton = ({
    network,
    emptyAccounts,
    onEnableAccount,
}: AddAccountButtonProps) => {
    switch (network.accountType) {
        case 'coinjoin':
            return <AddCoinJoinAccountButton network={network} />;
        default:
            return (
                <AddDefaultAccountButton
                    emptyAccounts={emptyAccounts}
                    onEnableAccount={onEnableAccount}
                />
            );
    }
};
