import { memoizeWithArgs } from 'proxy-memoize';
import { A, G, pipe } from '@mobily/ts-belt';

import { FiatRatesRootState } from '@suite-native/fiat-rates';
import {
    selectTransactionByTxidAndAccountKey,
    selectTransactionTargets,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { AccountKey, TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { getNetworkType, NetworkSymbol } from '@suite-common/wallet-config';
import { selectEthereumTokenHasFiatRates } from '@suite-native/ethereum-tokens';
import { SettingsSliceRootState } from '@suite-native/module-settings';

import { mapTransactionInputsOutputsToAddresses, sortTargetAddressesToBeginning } from './utils';
import { AddressesType, VinVoutAddress } from './types';

const selectTransactionTargetAddresses = memoizeWithArgs(
    (state: TransactionsRootState, txid: string, accountKey: AccountKey) => {
        const transaction = selectTransactionByTxidAndAccountKey(state, txid, accountKey);

        const transactionTargets = selectTransactionTargets(state, txid, accountKey);
        if (G.isNullable(transaction) || G.isNullable(transactionTargets)) return [];

        const isSentTransactionType = transaction.type === 'sent';

        return mapTransactionInputsOutputsToAddresses({
            inputsOutputs: transactionTargets,
            addressesType: 'outputs',
            isSentTransactionType,
        });
    },
    { size: 50 },
);

export const selectTransactionAddresses = memoizeWithArgs(
    (
        state: TransactionsRootState,
        txid: string,
        accountKey: AccountKey,
        addressesType: AddressesType,
    ): VinVoutAddress[] => {
        const transaction = selectTransactionByTxidAndAccountKey(state, txid, accountKey);

        if (G.isNullable(transaction)) return [];

        const networkType = getNetworkType(transaction.symbol);

        if (networkType === 'ripple') {
            // For ripple, we don't have inputs (input is always the same address - account descriptor)
            if (addressesType === 'inputs') {
                return [{ address: transaction.descriptor, isChangeAddress: false }];
            }

            // We have only one output so we don't need to sort it
            return selectTransactionTargetAddresses(state, txid, accountKey);
        }

        const targetAddresses = selectTransactionTargetAddresses(state, txid, accountKey);

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
    { size: 100 },
);

type TransactionTransferInputOutput = { address: string; amount?: string };
export type TransactionTranfer = {
    inputs: TransactionTransferInputOutput[];
    outputs: TransactionTransferInputOutput[];
    symbol: NetworkSymbol | TokenSymbol;
    decimals?: number;
};

export const selectTransactionInputAndOutputTransfers = memoizeWithArgs(
    (
        state: TransactionsRootState & FiatRatesRootState & SettingsSliceRootState,
        txid: string,
        accountKey: AccountKey,
    ): {
        externalTransfers: TransactionTranfer[];
        internalTransfers: TransactionTranfer[];
        tokenTransfers: TransactionTranfer[];
    } | null => {
        const transaction = selectTransactionByTxidAndAccountKey(state, txid, accountKey);

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

        const tokenTransfers: TransactionTranfer[] = pipe(
            tokens,
            A.filter(({ symbol, contract }) =>
                selectEthereumTokenHasFiatRates(
                    state,
                    contract as TokenAddress,
                    symbol as TokenSymbol,
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
    { size: 100 },
);
