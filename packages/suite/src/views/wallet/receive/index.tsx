import React from 'react';
import { WalletLayout } from '@wallet-components';
import { useDevice, useSelector, useActions } from '@suite-hooks';
import * as receiveActions from '@wallet-actions/receiveActions';
import FreshAddress from './components/FreshAddress';
import UsedAddresses from './components/UsedAddresses';
import { isPending } from '@wallet-utils/transactionUtils';
import { getAccountTransactions } from '@wallet-utils/accountUtils';

const Receive = () => {
    const { selectedAccount, receive, device, transactions } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        receive: state.wallet.receive,
        device: state.suite.device,
        transactions: state.wallet.transactions.transactions,
    }));
    const { showAddress } = useActions({
        showAddress: receiveActions.showAddress,
    });

    const { isLocked } = useDevice();
    const isDeviceLocked = isLocked(true);

    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_RECEIVE" account={selectedAccount} />;
    }

    const { account } = selectedAccount;
    const disabled = !!device.authConfirm;

    const pendingTxs = getAccountTransactions(transactions, account).filter(isPending);
    const pendingAddresses: string[] = [];
    pendingTxs.forEach(t =>
        t.targets.forEach(target => target.addresses?.forEach(a => pendingAddresses.unshift(a))),
    );

    return (
        <WalletLayout title="TR_NAV_RECEIVE" account={selectedAccount} showEmptyHeaderPlaceholder>
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
