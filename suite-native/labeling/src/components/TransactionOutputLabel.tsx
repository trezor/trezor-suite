import { useSelector } from 'react-redux';

import {
    TransactionsRootState,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';

import { selectIsLabelingEnabled } from '../selectors';

type TransactionOutputLabelProps = {
    txId: string;
    outputIndex: number;
    accountKey: AccountKey;
};

export const TransactionOutputLabel = ({
    txId,
    outputIndex,
    accountKey,
}: TransactionOutputLabelProps) => {
    const isLabelingEnabled = useSelector(selectIsLabelingEnabled);

    const transaction = useSelector((state: TransactionsRootState) =>
        selectTransactionByAccountKeyAndTxid(state, accountKey, txId),
    );

    const label = transaction?.targets.find(it => it.n === outputIndex)?.label ?? '';

    return isLabelingEnabled ? <Text>{label}</Text> : null;
};
