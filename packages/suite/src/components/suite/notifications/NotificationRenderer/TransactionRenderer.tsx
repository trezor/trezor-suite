import {
    selectAccounts,
    selectBlockchainState,
    selectSelectedDevice as selectDeviceSelector,
    selectDeviceThunk,
    selectDevices,
    selectTransactions,
} from '@suite-common/wallet-core';
import {
    findAccountDevice,
    findAccountsByDescriptor,
    findAccountsByNetwork,
    findTransaction,
    getAccountTransactions,
    getConfirmations,
    isStakeTypeTx,
} from '@suite-common/wallet-utils';

import { openModal } from 'src/actions/suite/modalActions';
import { goto } from 'src/actions/suite/routerActions';
import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { AccountLabeling } from 'src/components/suite/labeling';
import type { NotificationRendererProps } from 'src/components/suite/notifications/NotificationRenderer/NotificationRenderer';
import type { NotificationViewProps } from 'src/components/suite/notifications/Notifications/NotificationGroup/NotificationList/NotificationView';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { getTxAnchor } from 'src/utils/suite/anchor';

type TransactionRendererProps = NotificationViewProps &
    NotificationRendererProps<
        | 'tx-sent'
        | 'tx-received'
        | 'tx-confirmed'
        | 'tx-staked'
        | 'tx-unstaked'
        | 'tx-claimed'
        | 'tx-approved'
        | 'tx-revoked'
    >;

export const TransactionRenderer = ({ render: View, ...props }: TransactionRendererProps) => {
    const { symbol, descriptor, txid, formattedAmount, device } = props.notification;
    const accounts = useSelector(selectAccounts);
    const transactions = useSelector(selectTransactions);
    const blockchain = useSelector(selectBlockchainState);
    const devices = useSelector(selectDevices);
    const currentDevice = useSelector(selectDeviceSelector);
    const routeName = useSelector(selectRouteName);
    const dispatch = useDispatch();

    const networkAccounts = findAccountsByNetwork(symbol, accounts);
    const found = findAccountsByDescriptor(descriptor, networkAccounts);

    // fallback: account not found, it should never happen tho
    if (!found.length) return <View {...props} />;

    const account = found[0];
    const accountTxs = getAccountTransactions(account.key, transactions);
    const tx = findTransaction(txid, accountTxs);
    const accountDevice = findAccountDevice(account, devices);
    const confirmations = tx ? getConfirmations(tx, blockchain[account.symbol].blockHeight) : 0;
    const destinationRoute = isStakeTypeTx(tx?.ethereumSpecific?.parsedData?.methodId)
        ? 'wallet-staking'
        : 'wallet-index';
    const isTradingRoute = !!routeName?.includes('wallet-trading');

    const handleTransactionClick = () => {
        const deviceToSelect = accountDevice || device;
        if (deviceToSelect?.id !== currentDevice?.id) {
            dispatch(selectDeviceThunk({ device: deviceToSelect }));
        }

        const txAnchor = getTxAnchor(tx?.txid);
        dispatch(
            goto(destinationRoute, {
                params: {
                    accountIndex: account.index,
                    accountType: account.accountType,
                    symbol: account.symbol,
                },
                anchor: txAnchor,
            }),
        );

        if (tx?.txid) {
            dispatch(
                openModal({
                    type: 'transaction-detail',
                    txid: tx.txid,
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                    deviceState: account.deviceState,
                    flow: 'detail',
                }),
            );
        }
    };

    return (
        <View
            {...props}
            messageValues={{
                ...props.messageValues,
                amount: <HiddenPlaceholder>{formattedAmount}</HiddenPlaceholder>,
                account: (
                    <AccountLabeling
                        account={found}
                        showAccountTypeBadge
                        accountTypeBadgeSize="small"
                    />
                ),
                confirmations,
            }}
            action={
                tx && !isTradingRoute
                    ? {
                          onClick: handleTransactionClick,
                          label: 'TOAST_TX_BUTTON',
                      }
                    : undefined
            }
        />
    );
};
