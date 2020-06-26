import React from 'react';
import { WalletLayout } from '@wallet-components';
import { useDevice } from '@suite-hooks';
import FreshAddress from './components/FreshAddress';
import UsedAddresses from './components/UsedAddresses';
import { Props } from './Container';

export default ({ selectedAccount, receive, device, showAddress, addToast, openModal }: Props) => {
    const { isLocked } = useDevice();
    const isDeviceLocked = isLocked();
    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Receive" account={selectedAccount} />;
    }

    const { account } = selectedAccount;
    const disabled = !!device.authConfirm;

    const changeMetadata = (address: string, currentValue?: string) => {
        openModal({
            type: 'metadata-add',
            payload: {
                type: 'addressLabel',
                accountKey: account.key,
                defaultValue: address,
                value: currentValue,
            },
        });
    };

    return (
        <WalletLayout title="Receive" account={selectedAccount}>
            <FreshAddress
                account={account}
                addresses={receive}
                showAddress={showAddress}
                addToast={addToast}
                changeMetadata={changeMetadata}
                disabled={disabled}
                locked={isDeviceLocked}
            />
            <UsedAddresses
                account={account}
                addresses={receive}
                showAddress={showAddress}
                addToast={addToast}
                changeMetadata={changeMetadata}
                disabled={disabled}
                locked={isDeviceLocked}
            />
        </WalletLayout>
    );
};
