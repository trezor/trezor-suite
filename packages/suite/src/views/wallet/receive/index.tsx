import React from 'react';

import { WalletLayout, WalletLayoutHeader } from '@wallet-components';
import { useDevice, useSelector, useActions } from '@suite-hooks';
import * as receiveActions from '@wallet-actions/receiveActions';

import { selectPendingAccountAddresses } from '@suite-common/wallet-core';

import { FreshAddress } from './components/FreshAddress';
import { UsedAddresses } from './components/UsedAddresses';
import { Coinjoin } from './components/Coinjoin';

const Receive = () => {
    const { selectedAccount, receive, device } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        receive: state.wallet.receive,
        device: state.suite.device,
    }));
    const { showAddress } = useActions({
        showAddress: receiveActions.showAddress,
    });

    const { account } = selectedAccount;

    const pendingAddresses = useSelector(state =>
        selectPendingAccountAddresses(state, account?.key ?? null),
    );

    const { isLocked } = useDevice();

    const isDeviceLocked = isLocked(true);

    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_RECEIVE" account={selectedAccount} />;
    }

    const disabled = !!device.authConfirm;

    return (
        <WalletLayout title="TR_NAV_RECEIVE" account={selectedAccount}>
            <WalletLayoutHeader title="TR_NAV_RECEIVE" />
            <Coinjoin />
            <FreshAddress
                account={account}
                addresses={receive}
                showAddress={showAddress}
                disabled={disabled}
                locked={isDeviceLocked}
                pendingAddresses={pendingAddresses}
            />
            <UsedAddresses
                account={account}
                addresses={receive}
                showAddress={showAddress}
                locked={isDeviceLocked}
                pendingAddresses={pendingAddresses}
            />
        </WalletLayout>
    );
};

export default Receive;
