import { useCallback } from 'react';

import { analytics, EventType } from '@trezor/suite-analytics';
import { UnavailableCapability } from '@trezor/connect';
import { selectDevice } from '@suite-common/wallet-core';
import { Account } from 'src/types/wallet';
import { Network, NetworkAccountCollection } from '@suite-common/wallet-config';
import { Translation } from 'src/components/suite';
import { useAccountSearch, useSelector } from 'src/hooks/suite';
import { AddCoinjoinAccountButton } from './AddCoinjoinAccountButton';
import { AddButton } from './AddButton';

const verifyAvailability = ({
    emptyAccounts,
    account,
    unavailableCapability,
}: {
    emptyAccounts: Account[];
    account: Account;
    unavailableCapability?: UnavailableCapability;
}) => {
    if (unavailableCapability === 'no-support') {
        return 'TR_ACCOUNT_TYPE_NO_SUPPORT';
    }
    if (unavailableCapability === 'update-required') {
        return 'TR_ACCOUNT_TYPE_UPDATE_REQUIRED';
    }
    if (unavailableCapability === 'trezor-connect-outdated') {
        return 'FW_CAPABILITY_CONNECT_OUTDATED';
    }
    if (unavailableCapability === 'no-capability') {
        return 'TR_ACCOUNT_TYPE_NO_CAPABILITY';
    }
    if (!account) {
        // discovery failed?
        return 'MODAL_ADD_ACCOUNT_NO_ACCOUNT';
    }
    if (emptyAccounts.length === 0) {
        return 'MODAL_ADD_ACCOUNT_NO_EMPTY_ACCOUNT';
    }
    if (emptyAccounts.length > 1) {
        // prev account is empty, do not add another
        return 'MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY';
    }
    if (account.index === 0 && account.empty && account.accountType === 'normal') {
        // current (first normal) account is empty, do not add another
        return 'MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY';
    }
    if (account.index >= 10) {
        return 'MODAL_ADD_ACCOUNT_LIMIT_EXCEEDED';
    }
};

interface AddAccountButtonProps {
    network: Network;
    selectedAccount?: NetworkAccountCollection[number];
    emptyAccounts: Account[];
    onEnableAccount: (account: Account) => void;
}

const AddDefaultAccountButton = ({
    emptyAccounts,
    onEnableAccount,
    network,
    selectedAccount,
}: AddAccountButtonProps) => {
    const defaultAccount = emptyAccounts[emptyAccounts.length - 1];
    const device = useSelector(selectDevice);

    const { setCoinFilter, setSearchString, coinFilter } = useAccountSearch();

    const handleClick = useCallback(() => {
        const { accountType: type, path, symbol } = defaultAccount;
        onEnableAccount(defaultAccount);
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
    }, [defaultAccount, onEnableAccount, setSearchString, setCoinFilter, coinFilter]);

    const unavailableCapability = selectedAccount?.accountType
        ? device?.unavailableCapabilities?.[selectedAccount?.accountType]
        : undefined;

    const disabledMessage = verifyAvailability({
        emptyAccounts,
        account: defaultAccount,
        unavailableCapability,
    });

    return (
        <AddButton
            disabledMessage={disabledMessage && <Translation id={disabledMessage} />}
            networkName={network.name}
            onClick={handleClick}
        />
    );
};

export const AddAccountButton = ({
    network,
    selectedAccount,
    emptyAccounts,
    onEnableAccount,
}: AddAccountButtonProps) => {
    switch (selectedAccount?.accountType) {
        case 'coinjoin':
            return <AddCoinjoinAccountButton network={network} selectedAccount={selectedAccount} />;
        default:
            return (
                <AddDefaultAccountButton
                    network={network}
                    selectedAccount={selectedAccount}
                    emptyAccounts={emptyAccounts}
                    onEnableAccount={onEnableAccount}
                />
            );
    }
};
