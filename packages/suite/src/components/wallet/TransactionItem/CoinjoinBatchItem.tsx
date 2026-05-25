import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { IconCircle, Link } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount } from 'src/components/suite';
import { TransactionTimestamp } from 'src/components/wallet/TransactionTimestamp';
import { useDispatch } from 'src/hooks/suite';
import { type WalletAccountTransaction } from 'src/types/wallet/index';

import { TransactionLayout } from './TransactionLayout';
import { TransactionTargetLayout } from './TransactionTargetLayout';

type CoinjoinBatchItemProps = {
    transactions: WalletAccountTransaction[];
    isPending: boolean;
};

export const CoinjoinBatchItem = ({ transactions, isPending }: CoinjoinBatchItemProps) => {
    const dispatch = useDispatch();

    return (
        <TransactionLayout
            timestamp={
                transactions[0] ? <TransactionTimestamp transaction={transactions[0]} /> : null
            }
            heading={<Translation id="TR_COINJOIN_TRANSACTION_BATCH" />}
            icon={
                <IconCircle name="shuffle" intent={isPending ? 'warning' : 'neutral'} size={40} />
            }
        >
            {transactions.map(transaction => {
                const transactionAmount = new BigNumber(transaction.amount);

                const openTransactionDetail = () =>
                    dispatch(
                        openModal({
                            type: 'transaction-detail',
                            txid: transaction.txid,
                            descriptor: transaction.descriptor,
                            symbol: transaction.symbol,
                            deviceState: transaction.deviceState,
                            flow: 'detail',
                        }),
                    );

                return (
                    <TransactionTargetLayout
                        key={transaction.txid}
                        addressLabel={
                            <Link onClick={openTransactionDetail}>
                                <Translation
                                    id="TR_JOINT_TRANSACTION_TARGET"
                                    values={{
                                        in: transaction.details.vin.length,
                                        inMy: transaction.details.vin.filter(v => v.isAccountOwned)
                                            .length,
                                        out: transaction.details.vout.length,
                                        outMy: transaction.details.vout.filter(
                                            v => v.isAccountOwned,
                                        ).length,
                                    }}
                                />
                            </Link>
                        }
                        amount={
                            <FormattedCryptoAmount
                                value={formatNetworkAmount(
                                    transactionAmount.abs().toString(),
                                    transaction.symbol,
                                )}
                                symbol={transaction.symbol}
                                signValue={transactionAmount}
                            />
                        }
                    />
                );
            })}
        </TransactionLayout>
    );
};
