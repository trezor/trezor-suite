import { memoizeWithArgs } from 'proxy-memoize';
import { G } from '@mobily/ts-belt';

import {
    selectTransactionByTxidAndAccountKey,
    selectTransactionTargets,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';

import { mapTransactionInputsOutputsToAddresses, sortTargetAddressesToBeginning } from './utils';

const selectTransactionTargetAddresses = memoizeWithArgs(
    (state: TransactionsRootState, txid: string, accountKey: AccountKey) => {
        const transactionTargets = selectTransactionTargets(state, txid, accountKey);
        if (G.isNullable(transactionTargets)) return [];

        return mapTransactionInputsOutputsToAddresses(transactionTargets);
    },
    { size: 50 },
);

export const selectTransactionInputAddresses = memoizeWithArgs(
    (state: TransactionsRootState, txid: string, accountKey: AccountKey): string[] => {
        const transaction = selectTransactionByTxidAndAccountKey(state, txid, accountKey);

        if (G.isNullable(transaction)) return [];

        const inputAddresses = mapTransactionInputsOutputsToAddresses(transaction.details.vin);
        const targetAddresses = selectTransactionTargetAddresses(state, txid, accountKey);

        return sortTargetAddressesToBeginning(inputAddresses, targetAddresses);
    },
    { size: 50 },
);

export const selectTransactionOutputAddresses = memoizeWithArgs(
    (state: TransactionsRootState, txid: string, accountKey: AccountKey): string[] => {
        const transaction = selectTransactionByTxidAndAccountKey(state, txid, accountKey);

        if (G.isNullable(transaction)) return [];

        const outputAddresses = mapTransactionInputsOutputsToAddresses(transaction.details.vout);
        const targetAddresses = selectTransactionTargetAddresses(state, txid, accountKey);

        return sortTargetAddressesToBeginning(outputAddresses, targetAddresses);
    },
    { size: 50 },
);
