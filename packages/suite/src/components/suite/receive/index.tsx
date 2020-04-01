import React from 'react';
import { WalletLayout } from '@wallet-components';
import { SUITE } from '@suite-actions/constants';
import AccountSelector from '@wallet-components/AccountSelector/Container';
import Header from './components/Header';
import FreshAddress from './components/FreshAddress';
import UsedAddresses from './components/UsedAddresses';
import { Props } from './Container';

export default ({ selectedAccount, receive, locks, device, showAddress, addToast }: Props) => {
    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Receive" account={selectedAccount} />;
    }

    const { account } = selectedAccount;
    const locked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    const disabled = !!device.authConfirm;

    return (
        <WalletLayout title="Receive" account={selectedAccount}>
            <Header account={account} />
            <AccountSelector title="Receive" />
            <FreshAddress
                account={account}
                addresses={receive}
                showAddress={showAddress}
                addToast={addToast}
                disabled={disabled}
                locked={locked}
            />
            <UsedAddresses
                account={account}
                addresses={receive}
                showAddress={showAddress}
                addToast={addToast}
                disabled={disabled}
                locked={locked}
            />
        </WalletLayout>
    );
};
