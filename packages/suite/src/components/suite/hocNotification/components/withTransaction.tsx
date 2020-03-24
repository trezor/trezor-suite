import React from 'react';
import { connect } from 'react-redux';
import { AccountLabeling } from '@suite-components';
import * as suiteActions from '@suite-actions/suiteActions';
import * as routerActions from '@suite-actions/routerActions';
import { NotificationEntry } from '@suite-reducers/notificationReducer';
import * as accountUtils from '@wallet-utils/accountUtils';
import * as transactionUtils from '@wallet-utils/transactionUtils';
import { AppState, Dispatch } from '@suite-types';
import { ViewProps } from '../index';

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
export default (View: React.ComponentType<ViewProps>, props: StrictViewProps) => {
    const WrappedView = connect(mapStateToProps)((state: StateProps) => {
        const { notification } = props;
        const { accounts, transactions, devices, blockchain, dispatch } = state;
        const found = accountUtils.findAccountsByDescriptor(notification.descriptor, accounts);
        // fallback: account not found, it should never happen tho
        if (!found.length) return <View {...props} />;

        const account = found[0];
        const accountTxs = accountUtils.getAccountTransactions(transactions.transactions, account);
        const tx = transactionUtils.findTransaction(notification.txid, accountTxs);
        const device = accountUtils.findAccountDevice(account, devices);
        const confirmations =
            tx && tx.blockHeight && tx.blockHeight > 0
                ? blockchain[account.symbol].blockHeight - tx.blockHeight
                : 0;

        props.message.values = {
            amount: notification.formattedAmount,
            account: <AccountLabeling account={found} />,
            confirmations,
        };

        return (
            <View
                {...props}
                action={async () => {
                    // select device
                    await dispatch(suiteActions.selectDevice(device || notification.device));
                    // go to account
                    dispatch(
                        routerActions.goto('wallet-index', {
                            accountIndex: account.index,
                            accountType: account.accountType,
                            symbol: account.symbol,
                        }),
                    );
                }}
            />
        );
    });
    return <WrappedView key={props.notification.id} />;
};
