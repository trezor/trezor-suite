import { useCallback } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { type Network, type NetworkAccount } from '@suite-common/wallet-config';
import { type UnavailableCapability } from '@trezor/connect';

import { useAccountSearch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';
import { type Account } from 'src/types/wallet';

import { AddButton } from './AddButton';
import { AddCoinjoinAccountButton } from './AddCoinjoinAccountButton';

const verifyAvailability = ({
    emptyAccounts,
    account,
    unavailableCapability,
}: {
    emptyAccounts: Account[];
    account?: Account;
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

    if (account.networkType !== 'ethereum') {
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
    }
};

interface AddAccountButtonProps {
    network: Network;
    selectedAccount?: NetworkAccount;
    scopedAccounts: Account[];
    onEnableAccount: (account: Account) => void;
    onAddNewAccount: () => void;
}

const AddDefaultAccountButton = ({
    scopedAccounts,
    onEnableAccount,
    onAddNewAccount,
    network,
    selectedAccount,
}: AddAccountButtonProps) => {
    const defaultAccount = scopedAccounts.at(-1);
    const device = useSelector(selectSelectedDevice);
    const analytics = useAnalytics();

    const { setCoinFilter, setSearchString, coinFilter } = useAccountSearch();

    const handleClick = useCallback(() => {
        if (defaultAccount) {
            onEnableAccount(defaultAccount);
            // reset search string in account search box
            setSearchString(undefined);
            if (coinFilter && !coinFilter.includes(defaultAccount.symbol)) {
                // if coinFilter is active then reset it only if added account doesn't belong to selected/filtered coin
                setCoinFilter([]);
            }

            analytics.report({
                type: events.accountsNewAccountEvent.name,
                payload: {
                    type: defaultAccount.accountType,
                    path: defaultAccount.path,
                    symbol: defaultAccount.symbol,
                },
            });
        } else {
            onAddNewAccount();
        }
    }, [
        defaultAccount,
        onEnableAccount,
        setSearchString,
        coinFilter,
        analytics,
        setCoinFilter,
        onAddNewAccount,
    ]);

    const unavailableCapability = selectedAccount?.accountType
        ? device?.unavailableCapabilities?.[selectedAccount?.accountType]
        : undefined;

    const disabledMessage = verifyAvailability({
        emptyAccounts: scopedAccounts.filter(account => account.empty && !account.visible),
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
    scopedAccounts,
    onEnableAccount,
    onAddNewAccount,
}: AddAccountButtonProps) => {
    switch (selectedAccount?.accountType) {
        case 'coinjoin':
            return <AddCoinjoinAccountButton network={network} selectedAccount={selectedAccount} />;
        default:
            return (
                <AddDefaultAccountButton
                    network={network}
                    selectedAccount={selectedAccount}
                    scopedAccounts={scopedAccounts}
                    onEnableAccount={onEnableAccount}
                    onAddNewAccount={onAddNewAccount}
                />
            );
    }
};
