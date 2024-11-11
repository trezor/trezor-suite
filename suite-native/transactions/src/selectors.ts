import { A, G, pipe } from '@mobily/ts-belt';

import {
    getSimpleCoinDefinitionsByNetwork,
    isTokenDefinitionKnown,
    selectTokenDefinitions,
    TokenDefinitionsRootState,
} from '@suite-common/token-definitions';
import { getNetworkType, NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectTransactionByAccountKeyAndTxid,
    selectTransactionTargets,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { AccountKey, TokenSymbol } from '@suite-common/wallet-types';
import { createWeakMapSelector } from '@suite-common/redux-utils';

import { AddressesType, VinVoutAddress } from './types';
import { mapTransactionInputsOutputsToAddresses, sortTargetAddressesToBeginning } from './utils';

const createMemoizedSelector = createWeakMapSelector.withTypes<
    TransactionsRootState & TokenDefinitionsRootState
>();

const selectTransactionTargetAddresses = createMemoizedSelector(
    [selectTransactionByAccountKeyAndTxid, selectTransactionTargets],
    (transaction, transactionTargets) => {
        if (G.isNullable(transaction) || G.isNullable(transactionTargets)) return [];

        const isSentTransactionType = transaction.type === 'sent';

        return mapTransactionInputsOutputsToAddresses({
            inputsOutputs: transactionTargets,
            addressesType: 'outputs',
            isSentTransactionType,
        });
    },
);

export const selectTransactionAddresses = createMemoizedSelector(
    [
        selectTransactionByAccountKeyAndTxid,
        selectTransactionTargetAddresses,
        (_state, _accountKey: AccountKey, _txid: string, addressesType: AddressesType) =>
            addressesType,
    ],
    (transaction, transactionTargetAddresses, addressesType): VinVoutAddress[] => {
        if (G.isNullable(transaction)) return [];

        const networkType = getNetworkType(transaction.symbol);

        if (networkType === 'ripple') {
            // For ripple, we don't have inputs (input is always the same address - account descriptor)
            if (addressesType === 'inputs') {
                return [{ address: transaction.descriptor, isChangeAddress: false }];
            }

            // We have only one output so we don't need to sort it
            return transactionTargetAddresses;
        }

        const targetAddresses = transactionTargetAddresses;

        const inputsOutputs =
            addressesType === 'inputs' ? transaction.details.vin : transaction.details.vout;

        const isSentTransactionType = transaction.type === 'sent';

        const addresses = mapTransactionInputsOutputsToAddresses({
            inputsOutputs,
            addressesType,
            isSentTransactionType,
        });

        return sortTargetAddressesToBeginning(addresses, targetAddresses);
    },
);

type TransactionTransferInputOutput = { address: string; amount?: string };
export type TransactionTranfer = {
    inputs: TransactionTransferInputOutput[];
    outputs: TransactionTransferInputOutput[];
    symbol: NetworkSymbol | TokenSymbol;
    decimals?: number;
};

export const selectTransactionInputAndOutputTransfers = createMemoizedSelector(
    [selectTransactionByAccountKeyAndTxid, selectTokenDefinitions],
    (
        transaction,
        tokenDefinitions,
    ): {
        externalTransfers: TransactionTranfer[];
        internalTransfers: TransactionTranfer[];
        tokenTransfers: TransactionTranfer[];
    } | null => {
        if (G.isNullable(transaction)) return null;

        const networkType = getNetworkType(transaction.symbol);

        if (networkType === 'ripple') {
            const externalTransfers: TransactionTranfer[] = [
                {
                    inputs: [{ address: transaction.descriptor }],
                    outputs: [{ address: transaction.targets?.[0].addresses?.[0] ?? '' }],
                    symbol: transaction.symbol,
                },
            ];

            return { externalTransfers, internalTransfers: [], tokenTransfers: [] };
        }

        const externalTransfers: TransactionTranfer[] = [
            {
                inputs: transaction.details.vin.map(input => ({
                    address: input.addresses?.[0] ?? '',
                    amount: input.value,
                })),
                outputs: transaction.details.vout.map(output => ({
                    address: output.addresses?.[0] ?? '',
                    amount: output.value,
                })),
                symbol: transaction.symbol,
            },
        ];

        const { internalTransfers: rawInternalTransfers, tokens } = transaction;

        const internalTransfers: TransactionTranfer[] = rawInternalTransfers.map(
            ({ from, to, amount }) => ({
                inputs: [{ address: from }],
                outputs: [{ address: to, amount }],
                symbol: transaction.symbol,
            }),
        );

        const tokenDefinitionsForNetwork = getSimpleCoinDefinitionsByNetwork(
            tokenDefinitions,
            transaction.symbol,
        );

        const tokenTransfers: TransactionTranfer[] = pipe(
            tokens,
            A.filter(
                ({ contract }) =>
                    !!isTokenDefinitionKnown(
                        tokenDefinitionsForNetwork,
                        transaction.symbol,
                        contract,
                    ),
            ),
            A.map(({ from, to, amount, symbol, decimals }) => ({
                inputs: [{ address: from }],
                outputs: [{ address: to, amount }],
                symbol: symbol as TokenSymbol,
                decimals,
            })),
        ) as TransactionTranfer[];

        return { externalTransfers, internalTransfers, tokenTransfers };
    },
);
