import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import {
    type Network,
    type NetworkAccount,
    WATCH_ONLY_ACCOUNT_TYPE,
} from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { AddButton } from './AddButton';
import { AddCoinjoinAccountButton } from './AddCoinjoinAccountButton';
import { AddWatchOnlyAccountButton } from './AddWatchOnlyAccountButton';
import { verifyAvailability } from '../verifyAvailability';

interface AddAccountButtonProps {
    network: Network;
    selectedAccount?: NetworkAccount;
    scopedAccounts: Account[];
    onEnableAccount: (account: Account) => void;
    onAddNewAccount: () => void;
    isLoading?: boolean;
}

type AddAnyAccountButtonProps = AddAccountButtonProps & {
    watchOnlyAddress: string | undefined;
    onAddWatchOnlyAccount: (address: string) => void;
};

const AddDefaultAccountButton = ({
    scopedAccounts,
    onEnableAccount,
    onAddNewAccount,
    network,
    selectedAccount,
    isLoading,
}: AddAccountButtonProps) => {
    const defaultAccount = scopedAccounts.at(-1);
    const device = useSelector(selectSelectedDevice);

    const handleClick = useCallback(() => {
        if (defaultAccount) {
            onEnableAccount(defaultAccount);
        } else {
            onAddNewAccount();
        }
    }, [defaultAccount, onEnableAccount, onAddNewAccount]);

    const unavailableCapability = selectedAccount?.accountType
        ? device?.unavailableCapabilities?.[selectedAccount?.accountType]
        : undefined;

    const disabledMessage = verifyAvailability({ scopedAccounts, unavailableCapability });

    return (
        <AddButton
            disabledMessage={disabledMessage && <Translation id={disabledMessage} />}
            networkName={network.name}
            onClick={handleClick}
            isLoading={isLoading}
        />
    );
};

export const AddAccountButton = ({
    network,
    selectedAccount,
    scopedAccounts,
    onEnableAccount,
    onAddNewAccount,
    isLoading,
    watchOnlyAddress,
    onAddWatchOnlyAccount,
}: AddAnyAccountButtonProps) => {
    const isDebugModeEnabled = useSelector(selectIsDebugModeActive);

    switch (selectedAccount?.accountType) {
        case 'coinjoin':
            return <AddCoinjoinAccountButton network={network} selectedAccount={selectedAccount} />;
        case WATCH_ONLY_ACCOUNT_TYPE:
            if (!isDebugModeEnabled) return null;

            return (
                <AddWatchOnlyAccountButton
                    network={network}
                    address={watchOnlyAddress}
                    onAddWatchOnlyAccount={onAddWatchOnlyAccount}
                    isLoading={isLoading}
                />
            );
        default:
            return (
                <AddDefaultAccountButton
                    network={network}
                    selectedAccount={selectedAccount}
                    scopedAccounts={scopedAccounts}
                    onEnableAccount={onEnableAccount}
                    onAddNewAccount={onAddNewAccount}
                    isLoading={isLoading}
                />
            );
    }
};
