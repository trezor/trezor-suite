import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import {
    TransactionsRootState,
    selectTransactionByTxidAndAccountKey,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { ErrorMessage, VStack } from '@suite-native/atoms';

import { selectTransactionAddresses } from '../../selectors';
import { TransactionDetailAddressesSection } from './TransactionDetailAddressesSection';
import { TransactionDetailStatusSection } from './TransactionDetailStatusSection';

export const NetworkTransactionDetailSummary = ({
    accountKey,
    txid,
    onShowMore,
}: {
    accountKey: AccountKey;
    txid: string;
    onShowMore: () => void;
}) => {
    const transaction = useSelector((state: TransactionsRootState) =>
        selectTransactionByTxidAndAccountKey(state, txid, accountKey),
    );
    const transactionInputAddresses = useSelector((state: TransactionsRootState) =>
        selectTransactionAddresses(state, txid, accountKey, 'inputs'),
    );
    const transactionOutputAddresses = useSelector((state: TransactionsRootState) =>
        selectTransactionAddresses(state, txid, accountKey, 'outputs'),
    );

    if (!transaction) {
        return <ErrorMessage errorMessage="Target or Origin of transaction is unknown." />;
    }

    return (
        <VStack>
            {A.isNotEmpty(transactionInputAddresses) && (
                <TransactionDetailAddressesSection
                    addressesType="inputs"
                    addresses={transactionInputAddresses}
                    onShowMore={onShowMore}
                    icon={transaction.symbol}
                />
            )}
            <TransactionDetailStatusSection txid={txid} accountKey={accountKey} />
            {A.isNotEmpty(transactionOutputAddresses) && (
                <TransactionDetailAddressesSection
                    addressesType="outputs"
                    addresses={transactionOutputAddresses}
                    onShowMore={onShowMore}
                />
            )}
        </VStack>
    );
};
