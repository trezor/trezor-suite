import {
    selectDevice as selectDeviceSelector,
    selectDevices,
    selectAccounts,
    selectBlockchainState,
    selectTransactions,
    selectDeviceThunk,
} from '@suite-common/wallet-core';
import {
    findAccountsByNetwork,
    findAccountsByDescriptor,
    findAccountDevice,
    getAccountTransactions,
    findTransaction,
    getConfirmations,
} from '@suite-common/wallet-utils';

import {
    AccountLabeling,
    HiddenPlaceholder,
    NotificationRendererProps,
    NotificationViewProps,
} from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { getTxAnchor } from 'src/utils/suite/anchor';
import { isStakeTypeTx } from '@suite-common/suite-utils';

type TransactionRendererProps = NotificationViewProps &
    NotificationRendererProps<
        'tx-sent' | 'tx-received' | 'tx-confirmed' | 'tx-staked' | 'tx-unstaked' | 'tx-claimed'
    >;

export const TransactionRenderer = ({ render: View, ...props }: TransactionRendererProps) => {
    const accounts = useSelector(selectAccounts);
    const transactions = useSelector(selectTransactions);
    const blockchain = useSelector(selectBlockchainState);
    const devices = useSelector(selectDevices);
    const currentDevice = useSelector(selectDeviceSelector);
    const dispatch = useDispatch();

    const { symbol, descriptor, txid, formattedAmount, device } = props.notification;

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

    return (
        <View
            {...props}
            messageValues={{
                amount: <HiddenPlaceholder>{formattedAmount}</HiddenPlaceholder>,
                account: <AccountLabeling account={found} />,
                confirmations,
            }}
            action={{
                onClick: () => {
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
                },
                label: 'TOAST_TX_BUTTON',
            }}
        />
    );
};
