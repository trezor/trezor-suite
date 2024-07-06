import { findAccountDevice } from '@suite-common/wallet-utils';
import { isSelectedDevice } from '@suite-common/suite-utils';
import { selectDevices, selectDevice } from '@suite-common/wallet-core';

import { AccountLabel } from 'src/components/suite';
import { Account as WalletAccount } from 'src/types/wallet';
import { useSelector } from 'src/hooks/suite';
import { selectLabelingDataForAccount } from 'src/reducers/suite/metadataReducer';

import { WalletLabeling } from './WalletLabeling';

interface AccountProps {
    account: WalletAccount | WalletAccount[];
}

const MAX_LABEL_LENGTH = 10;

const truncateLabel = (label: string | undefined, maxLength: number): string => {
    if (!label) return '';
    if (label.length <= maxLength) return label;
    return `${label.substring(0, maxLength - 3)}...`;
};

export const AccountLabeling = ({ account }: AccountProps) => {
    const device = useSelector(selectDevice);
    const devices = useSelector(selectDevices);

    const accounts = !Array.isArray(account) ? [account] : account;
    const { symbol, index, accountType, key } = accounts[0];

    const labels = useSelector(state => selectLabelingDataForAccount(state, key));

    if (accounts.length < 1) return null;

    const accountLabelSafe = labels.accountLabel || ''; // Default to an empty string if undefined
    const truncatedAccountLabel = truncateLabel(accountLabelSafe, MAX_LABEL_LENGTH);

    const accountLabel = (
        <AccountLabel
            accountLabel={truncatedAccountLabel}
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