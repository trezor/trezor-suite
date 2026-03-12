import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { getTxAnchor, goto, selectRouteName } from '@suite/router';
import { selectDevices, selectSelectedDevice } from '@suite-common/device';
import {
    selectAccounts,
    selectBlockchainState,
    selectDeviceThunk,
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
import { Row } from '@trezor/components';
import { TransactionNotification } from '@trezor/product-components';

import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { AccountLabeling } from 'src/components/suite/labeling';
import type { NotificationRendererProps } from 'src/components/suite/notifications/NotificationRenderer/NotificationRenderer';
import type { NotificationViewProps } from 'src/components/suite/notifications/Notifications/NotificationGroup/NotificationList/NotificationView';
import { useDispatch, useSelector } from 'src/hooks/suite';

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
    const { symbol, descriptor, txid, device } = props.notification;
    const accounts = useSelector(selectAccounts);
    const transactions = useSelector(selectTransactions);
    const blockchain = useSelector(selectBlockchainState);
    const devices = useSelector(selectDevices);
    const currentDevice = useSelector(selectSelectedDevice);
    const routeName = useSelector(selectRouteName);
    const dispatch = useDispatch();

    const networkAccounts = findAccountsByNetwork(symbol, accounts);
    const account = findAccountsByDescriptor(descriptor, networkAccounts).at(0);

    // fallback: account not found, it should never happen tho
    if (!account) return <View {...props} />;

    const accountTxs = getAccountTransactions(account.key, transactions);
    const tx = findTransaction(txid, accountTxs);
    const accountDevice = findAccountDevice(account, devices);
    const confirmations = tx ? getConfirmations(tx, blockchain[account.symbol].blockHeight) : 0;
    const destinationRoute = isStakeTypeTx(tx?.ethereumSpecific?.parsedData?.methodId)
        ? 'wallet-staking'
        : 'wallet-index';
    const isTradingRoute = !!routeName?.includes('wallet-trading');
    const transactionToken = 'token' in props.notification ? props.notification.token : undefined;
    const toastTestIdPrefix = `@toast/${props.notification.type}`;

    const handleTransactionClick = () => {
        const deviceToSelect = accountDevice || device;
        if (deviceToSelect?.id !== currentDevice?.id) {
            dispatch(selectDeviceThunk({ device: deviceToSelect }));
        }

        const txAnchor = getTxAnchor(tx?.txid);
        dispatch(
            goto({
                routeName: destinationRoute,
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
            message="TOAST_TX_COMPOSED"
            messageValues={{
                content: (
                    <TransactionNotification
                        message={
                            <Translation
                                id={props.message}
                                values={{
                                    ...props.messageValues,
                                    account: (
                                        <Row
                                            display="inline-flex"
                                            alignItems="center"
                                            data-testid={`${toastTestIdPrefix}/account`}
                                        >
                                            <AccountLabeling
                                                account={account}
                                                showAccountTypeBadge
                                                accountTypeBadgeSize="small"
                                            />
                                        </Row>
                                    ),
                                    confirmations,
                                }}
                            />
                        }
                        notificationType={props.notification.type}
                        symbol={props.notification.symbol}
                        accountSymbol={account.symbol}
                        token={transactionToken}
                        amount={props.notification.formattedAmount}
                        isInfiniteApproval={
                            props.notification.type === 'tx-approved' &&
                            props.notification.isInfiniteApproval
                        }
                        unlimitedApprovalLabel={<Translation id="TR_APPROVE_AMOUNT_UNLIMITED" />}
                        renderAmount={amount => (
                            <HiddenPlaceholder data-testid={`${toastTestIdPrefix}/amount`}>
                                {amount}
                            </HiddenPlaceholder>
                        )}
                    />
                ),
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
