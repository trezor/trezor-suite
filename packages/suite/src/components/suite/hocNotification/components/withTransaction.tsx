import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { AccountLabeling } from '@suite-components';
import { NotificationEntry } from '@suite-reducers/notificationReducer';
import * as accountUtils from '@wallet-utils/accountUtils';
import * as transactionUtils from '@wallet-utils/transactionUtils';
import { AppState, Dispatch } from '@suite-types';
import { ViewProps } from '../index';
import { useActions } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';
import { WalletAccountTransaction } from '@suite/types/wallet';

const TabularNums = styled.span`
    font-variant-numeric: tabular-nums;
`;

const mapStateToProps = (state: AppState) => ({
    devices: state.devices,
    accounts: state.wallet.accounts,
    transactions: state.wallet.transactions,
    blockchain: state.wallet.blockchain,
});

type StateProps = ReturnType<typeof mapStateToProps> & {
    dispatch: Dispatch;
};

type StrictViewProps = ViewProps & {
    notification: Extract<NotificationEntry, { type: 'tx-sent' | 'tx-received' | 'tx-confirmed' }>;
};

/**
 * HOC component for specific `state.notifications` views with Transaction
 * This component needs to be connected to reducers permanently
 * to re-render content on every block change (confirmations)
 * @param {React.ComponentType<ViewProps>} View
 * @param {StrictViewProps} props
 */
const withTransaction = (View: React.ComponentType<ViewProps>, props: StrictViewProps) => {
    const WrappedView = connect(mapStateToProps)((state: StateProps) => {
        const { notification } = props;
        const { accounts, transactions, blockchain } = state;
        const networkAccounts = accounts.filter(a => a.symbol === notification.symbol);
        const found = accountUtils.findAccountsByDescriptor(
            notification.descriptor,
            networkAccounts,
        );
        const { openModal } = useActions({
            openModal: modalActions.openModal,
        });

        // fallback: account not found, it should never happen tho
        if (!found.length) return <View {...props} />;

        const account = found[0];
        const accountTxs = accountUtils.getAccountTransactions(transactions.transactions, account);
        const tx = transactionUtils.findTransaction(notification.txid, accountTxs);
        const confirmations = tx
            ? transactionUtils.getConfirmations(tx, blockchain[account.symbol].blockHeight)
            : 0;

        if (typeof props.message !== 'string') {
            props.message.values = {
                amount: <TabularNums>{notification.formattedAmount}</TabularNums>,
                account: <AccountLabeling account={found} />,
                confirmations,
            };
        }

        const openTxDetailsModal = (transaction: WalletAccountTransaction, rbfForm?: boolean) => {
            openModal({
                type: 'transaction-detail',
                tx: transaction,
                rbfForm,
            });
        };

        return (
            <View
                {...props}
                action={() => {
                    if (tx) openTxDetailsModal(tx, tx.rbfParams !== undefined);
                }}
            />
        );
    });
    return <WrappedView key={props.notification.id} />;
};

export default withTransaction;
