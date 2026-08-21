import { useCallback } from 'react';

import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { type Network, type NetworkAccount } from '@suite-common/wallet-config';

import { useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';

import { AddButton } from './AddButton';
import { AddCoinjoinAccountButton } from './AddCoinjoinAccountButton';
import { verifyAvailability } from '../verifyAvailability';

interface AddAccountButtonProps {
    network: Network;
    selectedAccount?: NetworkAccount;
    scopedAccounts: Account[];
    onEnableAccount: (account: Account) => void;
    onAddNewAccount: () => void;
    isLoading?: boolean;
}

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
                    isLoading={isLoading}
                />
            );
    }
};
