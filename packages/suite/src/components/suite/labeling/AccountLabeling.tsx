import { isSelectedDevice } from '@suite-common/suite-utils';
import { selectDevices, selectSelectedDevice } from '@suite-common/wallet-core';
import { findAccountDevice } from '@suite-common/wallet-utils';
import { BadgeProps } from '@trezor/components';

import { AccountLabel } from 'src/components/suite/AccountLabel';
import { useSelector } from 'src/hooks/suite';
import { Account as WalletAccount } from 'src/types/wallet';

import { WalletLabeling } from './WalletLabeling';

interface AccountProps {
    account: WalletAccount | WalletAccount[];
    accountTypeBadgeSize?: BadgeProps['size'];
    showAccountTypeBadge?: boolean;
}

export const AccountLabeling = ({
    account,
    accountTypeBadgeSize,
    showAccountTypeBadge,
}: AccountProps) => {
    const device = useSelector(selectSelectedDevice);
    const devices = useSelector(selectDevices);

    const accounts = !Array.isArray(account) ? [account] : account;

    if (accounts.length < 1) return null;

    const accountLabel = (
        <AccountLabel
            account={accounts[0]}
            showAccountTypeBadge={showAccountTypeBadge}
            accountTypeBadgeSize={accountTypeBadgeSize}
        />
    );

    if (device && !accounts.find(a => a.deviceState === device.state?.staticSessionId)) {
        // account is not associated with selected device, add wallet label
        const accountDevice = findAccountDevice(accounts[0], devices);
        if (accountDevice) {
            return (
                <span>
                    <WalletLabeling
                        device={accountDevice}
                        shouldUseDeviceLabel={!isSelectedDevice(device, accountDevice)}
                    />
                    {accountLabel}
                </span>
            );
        }
    }

    return accountLabel;
};
