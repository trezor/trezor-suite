import React from 'react';
import { WalletLayout } from '@wallet-components';
import { useDevice } from '@suite-hooks';
import FreshAddress from './components/FreshAddress';
import UsedAddresses from './components/UsedAddresses';
import { Props } from './Container';

const Receive = ({ selectedAccount, receive, device, showAddress }: Props) => {
    const { isLocked } = useDevice();
    const isDeviceLocked = isLocked(true);
    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_RECEIVE" account={selectedAccount} />;
    }

    const { account } = selectedAccount;
    const disabled = !!device.authConfirm;

    return (
        <WalletLayout title="TR_NAV_RECEIVE" account={selectedAccount}>
            <FreshAddress
                account={account}
                addresses={receive}
                showAddress={showAddress}
                disabled={disabled}
                locked={isDeviceLocked}
            />
            <UsedAddresses
                account={account}
                addresses={receive}
                showAddress={showAddress}
                disabled={disabled}
                locked={isDeviceLocked}
            />
        </WalletLayout>
    );
};

export default Receive;
