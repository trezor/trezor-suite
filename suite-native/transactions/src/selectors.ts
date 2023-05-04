import { memoizeWithArgs } from 'proxy-memoize';
import { G } from '@mobily/ts-belt';

import {
    selectTransactionByTxidAndAccountKey,
    selectTransactionTargets,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';

import { mapTransactionInputsOutputsToAddresses, sortTargetAddressesToBeginning } from './utils';

export type AddressesType = 'inputs' | 'outputs';

const selectTransactionTargetAddresses = memoizeWithArgs(
    (state: TransactionsRootState, txid: string, accountKey: AccountKey) => {
        const transactionTargets = selectTransactionTargets(state, txid, accountKey);
        if (G.isNullable(transactionTargets)) return [];

        return mapTransactionInputsOutputsToAddresses(transactionTargets);
    },
    { size: 50 },
);

export const selectTransactionAddresses = memoizeWithArgs(
    (
        state: TransactionsRootState,
        txid: string,
        accountKey: AccountKey,
        addressesType: AddressesType,
    ): string[] => {
        const transaction = selectTransactionByTxidAndAccountKey(state, txid, accountKey);

        if (G.isNullable(transaction)) return [];

        const inputsOrOutputs =
            addressesType === 'inputs' ? transaction.details.vin : transaction.details.vout;

        const addresses = mapTransactionInputsOutputsToAddresses(inputsOrOutputs);

        const targetAddresses = selectTransactionTargetAddresses(state, txid, accountKey);

        return sortTargetAddressesToBeginning(addresses, targetAddresses);
    },
    { size: 100 },
);
