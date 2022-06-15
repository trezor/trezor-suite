import React, { useCallback } from 'react';
import { analytics, EventType } from '@trezor/suite-analytics';

import { Button, Tooltip } from '@trezor/components';
import { Account } from '@wallet-types';
import { Translation } from '@suite-components';
import { useAccountSearch } from '@suite-hooks';

const verifyAvailibility = ({
    emptyAccounts,
    account,
}: {
    emptyAccounts: Account[];
    account: Account;
}) => {
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

interface ButtonProps {
    account: Account;
    isDisabled: boolean;
    onEnableAccount: (account: Account) => void;
}

const AddButton = ({ account, isDisabled, onEnableAccount }: ButtonProps) => {
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

    return (
        <Button
            data-test="@add-account"
            icon="PLUS"
            variant="primary"
            isDisabled={isDisabled}
            onClick={handleClick}
        >
            <Translation id="TR_ADD_ACCOUNT" />
        </Button>
    );
};

interface Props {
    emptyAccounts: Account[];
    onEnableAccount: (account: Account) => void;
}

export const AddAccountButton = ({ emptyAccounts, onEnableAccount }: Props) => {
    if (emptyAccounts.length === 0) return null;
    const account = emptyAccounts[emptyAccounts.length - 1];

    const disabledMessage = verifyAvailibility({ emptyAccounts, account });

    return (
        <Tooltip maxWidth={285} content={disabledMessage}>
            <AddButton
                account={account}
                isDisabled={!!disabledMessage}
                onEnableAccount={onEnableAccount}
            />
        </Tooltip>
    );
};
