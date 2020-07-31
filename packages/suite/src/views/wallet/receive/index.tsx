import React from 'react';
import { WalletLayout } from '@wallet-components';
import { useDevice } from '@suite-hooks';
import FreshAddress from './components/FreshAddress';
import UsedAddresses from './components/UsedAddresses';
import { Props } from './Container';

export default ({ selectedAccount, receive, device, showAddress, addToast }: Props) => {
    const { isLocked } = useDevice();
    const isDeviceLocked = isLocked();
    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Receive" account={selectedAccount} />;
    }

    const { account } = selectedAccount;
    const disabled = !!device.authConfirm;

    return (
        <WalletLayout title="Receive" account={selectedAccount}>
            <FreshAddress
                account={account}
                addresses={receive}
                showAddress={showAddress}
                addToast={addToast}
                accountKey={account.key}
                disabled={disabled}
                locked={isDeviceLocked}
            />
            <UsedAddresses
                account={account}
                addresses={receive}
                showAddress={showAddress}
                addToast={addToast}
                accountKey={account.key}
                disabled={disabled}
                locked={isDeviceLocked}
            />
        </WalletLayout>
    );
};
