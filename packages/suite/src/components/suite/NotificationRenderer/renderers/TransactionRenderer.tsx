import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import {
    selectAccountByDescriptor,
    selectTransactionByTxidAndAccount,
} from '@suite-common/wallet-core';
import { findAccountDevice, getConfirmations } from '@suite-common/wallet-utils';
import { AccountLabeling, HiddenPlaceholder } from '@suite-components';
import { useActions, useSelector } from '@suite-hooks';
import { getTxAnchor } from '@suite-utils/anchor';
import React from 'react';
import styled from 'styled-components';

import type { NotificationRendererProps, NotificationViewProps } from '../types';

const StyledHiddenPlaceholder = styled(HiddenPlaceholder)`
    font-variant-numeric: tabular-nums;
`;

type TransactionRendererProps = NotificationViewProps &
    NotificationRendererProps<'tx-sent' | 'tx-received' | 'tx-confirmed'>;

const TransactionRenderer = ({ render: View, ...props }: TransactionRendererProps) => {
    const { descriptor, txid, formattedAmount, device } = props.notification;

    const { selectDevice, goto } = useActions({
        selectDevice: suiteActions.selectDevice,
        goto: routerActions.goto,
    });

    const { devices, blockchain, currentDevice } = useSelector(state => ({
        devices: state.devices,
        currentDevice: state.suite.device,
        accounts: state.wallet.accounts,
        blockchain: state.wallet.blockchain,
    }));
    const transaction = useSelector(state =>
        selectTransactionByTxidAndAccount(state, txid, descriptor),
    );
    const account = useSelector(state => selectAccountByDescriptor(state, descriptor));

    // fallback: account not found, it should never happen tho
    if (!account || !transaction) return <View {...props} />;

    const accountDevice = findAccountDevice(account, devices);
    const confirmations = transaction
        ? getConfirmations(transaction, blockchain[account.symbol].blockHeight)
        : 0;

    return (
        <View
            {...props}
            messageValues={{
                amount: <StyledHiddenPlaceholder>{formattedAmount}</StyledHiddenPlaceholder>,
                account: <AccountLabeling account={account} />,
                confirmations,
            }}
            action={{
                onClick: () => {
                    const deviceToSelect = accountDevice || device;
                    if (deviceToSelect?.id !== currentDevice?.id) {
                        selectDevice(deviceToSelect);
                    }
                    const txAnchor = getTxAnchor(transaction?.txid);
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
