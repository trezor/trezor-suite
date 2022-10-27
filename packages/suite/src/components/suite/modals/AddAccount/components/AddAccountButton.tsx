import React, { useCallback } from 'react';
import { analytics, EventType } from '@trezor/suite-analytics';
import { Account, Network } from '@wallet-types';
import { UnavailableCapability } from '@trezor/connect';
import { Translation } from '@suite-components';
import { AddCoinJoinAccountButton } from './AddCoinJoinAccountButton';
import { AddButton } from './AddButton';
import { useAccountSearch, useSelector } from '@suite-hooks';

const verifyAvailability = ({
    emptyAccounts,
    account,
    unavailableCapability,
    majorVersion,
}: {
    emptyAccounts: Account[];
    account: Account;
    unavailableCapability?: UnavailableCapability;
    majorVersion?: number;
}) => {
    if (unavailableCapability === 'no-support') {
        return majorVersion === 1
            ? 'TR_ACCOUNT_TYPE_NO_SUPPORT_T1'
            : 'TR_ACCOUNT_TYPE_NO_SUPPORT_T2';
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
    emptyAccounts: Account[];
    onEnableAccount: (account: Account) => void;
}

const AddDefaultAccountButton = ({
    emptyAccounts,
    onEnableAccount,
    network,
}: AddAccountButtonProps) => {
    const account = emptyAccounts[emptyAccounts.length - 1];
    const device = useSelector(state => state.suite.device);

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

    const unavailableCapability = network.accountType
        ? device?.unavailableCapabilities?.[network.accountType]
        : undefined;

    const disabledMessage = verifyAvailability({
        emptyAccounts,
        account,
        unavailableCapability,
        majorVersion: device?.features?.major_version,
    });

    return (
        <AddButton
            disabledMessage={disabledMessage && <Translation id={disabledMessage} />}
            handleClick={handleClick}
        />
    );
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
                    network={network}
                    emptyAccounts={emptyAccounts}
                    onEnableAccount={onEnableAccount}
                />
            );
    }
};
