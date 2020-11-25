import React from 'react';
import { WalletLayout } from '@wallet-components';
import { useDevice } from '@suite-hooks';
import FreshAddress from './components/FreshAddress';
import UsedAddresses from './components/UsedAddresses';
import { useSelector } from '@suite/hooks/suite';
import { isPending } from '@wallet-utils/transactionUtils';
import { getAccountTransactions } from '@wallet-utils/accountUtils';
import { Props } from './Container';

const Receive = ({ selectedAccount, receive, device, showAddress }: Props) => {
    const { isLocked } = useDevice();
    const isDeviceLocked = isLocked(true);
    const transactions = useSelector(state => state.wallet.transactions.transactions);

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
                disabled={disabled}
                locked={isDeviceLocked}
                pendingAddresses={pendingAddresses}
            />
        </WalletLayout>
    );
};

export default Receive;
