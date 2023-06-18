import React from 'react';
import styled from 'styled-components';
import { AccountLabeling, HiddenPlaceholder } from 'src/components/suite';
import * as suiteActions from 'src/actions/suite/suiteActions';
import * as routerActions from 'src/actions/suite/routerActions';
import {
    findAccountsByNetwork,
    findAccountsByDescriptor,
    findAccountDevice,
    getAccountTransactions,
    findTransaction,
    getConfirmations,
} from '@suite-common/wallet-utils';
import { useActions, useSelector } from 'src/hooks/suite';
import { getTxAnchor } from 'src/utils/suite/anchor';

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
        transactions: state.wallet.transactions.transactions,
        blockchain: state.wallet.blockchain,
    }));

    const networkAccounts = findAccountsByNetwork(symbol, accounts);
    const found = findAccountsByDescriptor(descriptor, networkAccounts);
    // fallback: account not found, it should never happen tho
    if (!found.length) return <View {...props} />;

    const account = found[0];
    const accountTxs = getAccountTransactions(account.key, transactions);
    const tx = findTransaction(txid, accountTxs);
    const accountDevice = findAccountDevice(account, devices);
    const confirmations = tx ? getConfirmations(tx, blockchain[account.symbol].blockHeight) : 0;

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
