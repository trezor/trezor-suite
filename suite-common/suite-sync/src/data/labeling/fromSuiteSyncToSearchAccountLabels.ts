import { SuiteSyncAddress, SuiteSyncOutput } from '@suite-common/suite-sync-storage';
import { SearchAccountLabels, SearchOutputLabels, TxId } from '@suite-common/transaction-search';
import { asTxTargetId } from '@suite-common/wallet-types';

import { AllLabelsForAccount } from './selectAllLabelsForAccount';

export const fromSuiteSyncToSearchOutputLabels = (
    outputLabels: SuiteSyncOutput[] = [],
): SearchOutputLabels =>
    outputLabels.reduce<SearchOutputLabels>((acc, { txId, txTargetId, label }) => {
        if (label === null) return acc;

        if (!acc.has(txId as TxId)) {
            acc.set(txId as TxId, new Map([[asTxTargetId(`${txTargetId}`), label]]));
        } else {
            acc.get(txId as TxId)?.set(asTxTargetId(`${txTargetId}`), label);
        }

        return acc;
    }, new Map());

export const fromSuiteSyncToSearchAddressLabels = (
    addressLabels: SuiteSyncAddress[] = [],
): Map<string, string> =>
    new Map(
        addressLabels.flatMap(({ address, label }) =>
            label === null ? [] : ([[address, label]] as const),
        ),
    );

export const fromSuiteSyncToSearchAccountLabels = (
    accountLabels: AllLabelsForAccount,
): SearchAccountLabels => ({
    accountLabel: accountLabels.accountLabel,
    outputLabels: fromSuiteSyncToSearchOutputLabels(accountLabels.outputLabels),
    addressLabels: fromSuiteSyncToSearchAddressLabels(accountLabels.addressLabels),
});
