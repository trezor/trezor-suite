import { Translation } from '@suite/intl';
import { getCoingeckoId, getDisplaySymbol } from '@suite-common/wallet-config';
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
import { Column, Row } from '@trezor/components';
import { AssetLogo, CoinLogo } from '@trezor/product-components';

import { openModal } from 'src/actions/suite/modalActions';
import { goto } from 'src/actions/suite/routerActions';
import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { AccountLabeling } from 'src/components/suite/labeling';
import type { NotificationRendererProps } from 'src/components/suite/notifications/NotificationRenderer/NotificationRenderer';
import type { NotificationViewProps } from 'src/components/suite/notifications/Notifications/NotificationGroup/NotificationList/NotificationView';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { Account } from 'src/types/wallet';
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

type TransactionRendererContentProps = {
    notification: TransactionRendererProps['notification'];
    account: Account;
};

const TransactionRendererContent = ({ notification, account }: TransactionRendererContentProps) => {
    const amountTestId = `@toast/${notification.type}/amount`;

    switch (notification.type) {
        case 'tx-approved':
        case 'tx-revoked': {
            const { token, symbol } = notification;
            const coingeckoId = getCoingeckoId(account.symbol);

            return (
                <Row gap={8} alignItems="center">
                    <AssetLogo
                        symbol={symbol}
                        coingeckoId={coingeckoId ?? ''}
                        contractAddress={token.contract}
                        placeholder={token.name ?? symbol}
                        size={20}
                        shouldTryToFetch
                    />
                    <HiddenPlaceholder data-testid={amountTestId}>
                        <Row display="inline-flex" gap={4} alignItems="baseline">
                            {notification.type === 'tx-approved' &&
                            notification.isInfiniteApproval ? (
                                <Translation id="TR_APPROVE_AMOUNT_UNLIMITED" />
                            ) : (
                                notification.formattedAmount
                            )}
                            <span>{getDisplaySymbol(token.symbol ?? notification.symbol)}</span>
                        </Row>
                    </HiddenPlaceholder>
                </Row>
            );
        }
        case 'tx-sent':
        case 'tx-received': {
            const { token, symbol } = notification;
            const coingeckoId = getCoingeckoId(account.symbol);

            return (
                <Row gap={8} alignItems="center">
                    {token ? (
                        <AssetLogo
                            symbol={symbol}
                            coingeckoId={coingeckoId ?? ''}
                            contractAddress={token.contract}
                            placeholder={token.name ?? symbol}
                            size={20}
                            shouldTryToFetch
                        />
                    ) : (
                        <CoinLogo symbol={symbol} size={20} />
                    )}

                    <HiddenPlaceholder data-testid={amountTestId}>
                        {notification.formattedAmount}
                    </HiddenPlaceholder>
                </Row>
            );
        }
        case 'tx-staked':
        case 'tx-unstaked':
        case 'tx-claimed':
        case 'tx-confirmed':
        default: {
            const { symbol } = notification;

            return (
                <Row gap={8} alignItems="center">
                    <CoinLogo symbol={symbol} size={20} />

                    <HiddenPlaceholder data-testid={amountTestId}>
                        {notification.formattedAmount}
                    </HiddenPlaceholder>
                </Row>
            );
        }
    }
};

export const TransactionRenderer = ({ render: View, ...props }: TransactionRendererProps) => {
    const { symbol, descriptor, txid, device } = props.notification;
    const accounts = useSelector(selectAccounts);
    const transactions = useSelector(selectTransactions);
    const blockchain = useSelector(selectBlockchainState);
    const devices = useSelector(selectDevices);
    const currentDevice = useSelector(selectDeviceSelector);
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
            message="TOAST_TX_COMPOSED"
            messageValues={{
                content: (
                    <Column gap={4}>
                        <Translation
                            id={props.message}
                            values={{
                                ...props.messageValues,
                                account: (
                                    <Row
                                        display="inline-flex"
                                        alignItems="center"
                                        data-testid={`@toast/${props.notification.type}/account`}
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
                        <TransactionRendererContent
                            account={account}
                            notification={props.notification}
                        />
                    </Column>
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
