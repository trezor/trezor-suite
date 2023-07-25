import React from 'react';
import { findAccountDevice } from '@suite-common/wallet-utils';
import { isSelectedDevice } from 'src/utils/suite/device';
import { AccountLabel } from 'src/components/suite';
import { Account as WalletAccount } from 'src/types/wallet';
import { useSelector } from 'src/hooks/suite';
import { WalletLabeling } from './WalletLabeling';

interface AccountProps {
    account: WalletAccount | WalletAccount[];
}

export const AccountLabeling = ({ account }: AccountProps) => {
    const device = useSelector(state => state.suite.device);
    const devices = useSelector(state => state.devices);

    const accounts = !Array.isArray(account) ? [account] : account;

    if (accounts.length < 1) return null;

    const { metadata, symbol, index, accountType } = accounts[0];

    const accountLabel = (
        <AccountLabel
            accountLabel={metadata?.accountLabel}
            accountType={accountType}
            symbol={symbol}
            index={index}
        />
    );

    if (device && !accounts.find(a => a.deviceState === device.state)) {
        // account is not associated with selected device, add wallet label
        const accountDevice = findAccountDevice(accounts[0], devices);
        if (accountDevice) {
            return (
                <span>
                    <WalletLabeling
                        device={accountDevice}
                        shouldUseDeviceLabel={!isSelectedDevice(device, accountDevice)}
                    />{' '}
                    {accountLabel}
                </span>
            );
        }
    }

    return accountLabel;
};
