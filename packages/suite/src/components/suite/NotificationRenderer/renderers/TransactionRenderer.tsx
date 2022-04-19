import React from 'react';
import styled from 'styled-components';
import { AccountLabeling, HiddenPlaceholder } from '@suite-components';
import * as suiteActions from '@suite-actions/suiteActions';
import * as routerActions from '@suite-actions/routerActions';
import * as accountUtils from '@wallet-utils/accountUtils';
import * as transactionUtils from '@wallet-utils/transactionUtils';
import { useActions, useSelector } from '@suite-hooks';
import { getTxAnchor } from '@suite-utils/anchor';

import type { NotificationRendererProps, NotificationViewProps } from '../types';

const StyledHiddenPlaceholder = styled(HiddenPlaceholder)`
    font-variant-numeric: tabular-nums;
`;

type TransactionRendererProps = NotificationViewProps &
    NotificationRendererProps<'tx-sent' | 'tx-received' | 'tx-confirmed'>;

const TransactionRenderer = ({ render: View, ...props }: TransactionRendererProps) => {
    const { symbol, descriptor, txid, formattedAmount, device } = props.notification;

    const { selectDevice, goto } = useActions({
        selectDevice: suiteActions.selectDevice,
        goto: routerActions.goto,
    });

    const { accounts, transactions, devices, blockchain, currentDevice } = useSelector(state => ({
        devices: state.devices,
        currentDevice: state.suite.device,
        accounts: state.wallet.accounts,
        transactions: state.wallet.transactions,
        blockchain: state.wallet.blockchain,
    }));

    const networkAccounts = accounts.filter(a => a.symbol === symbol);
    const found = accountUtils.findAccountsByDescriptor(descriptor, networkAccounts);
    // fallback: account not found, it should never happen tho
    if (!found.length) return <View {...props} />;

    const account = found[0];
    const accountTxs = accountUtils.getAccountTransactions(transactions.transactions, account);
    const tx = transactionUtils.findTransaction(txid, accountTxs);
    const accountDevice = accountUtils.findAccountDevice(account, devices);
    const confirmations = tx
        ? transactionUtils.getConfirmations(tx, blockchain[account.symbol].blockHeight)
        : 0;

    return (
        <View
            {...props}
            messageValues={{
                amount: <StyledHiddenPlaceholder>{formattedAmount}</StyledHiddenPlaceholder>,
                account: <AccountLabeling account={found} />,
                confirmations,
            }}
            action={{
                onClick: () => {
                    const deviceToSelect = accountDevice || device;
                    if (deviceToSelect?.id !== currentDevice?.id) {
                        selectDevice(deviceToSelect);
                    }
                    const txAnchor = getTxAnchor(tx?.txid);
                    goto('wallet-index', {
                        params: {
                            accountIndex: account.index,
                            accountType: account.accountType,
                            symbol: account.symbol,
                        },
                        anchor: txAnchor,
                    });
                },
                label: 'TOAST_TX_BUTTON',
            }}
        />
    );
};

export default TransactionRenderer;
