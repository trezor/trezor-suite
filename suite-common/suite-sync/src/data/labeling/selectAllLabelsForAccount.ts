import { createWeakMapSelector } from '@suite-common/redux-utils';
import type { SuiteSyncAddress, SuiteSyncOutput } from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor, WalletDescriptor } from '@suite-common/wallet-types';

import { selectSuiteSyncAccountLabel } from '../account/selectSuiteSyncAccountLabel';
import { selectSuiteSyncAccountAddressesByAccount } from '../address/suiteSyncAddressSelectors';
import { selectSuiteSyncOutputLabelsByAccount } from '../output/suiteSyncOutputSelectors';
import { type SuiteSyncDataRootState } from '../suiteSyncDataReducer';

type SelectAllLabelsForAccountParams = {
    walletDescriptor: WalletDescriptor;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export type AllLabelsForAccount = {
    accountLabel: string | null;
    addressLabels: SuiteSyncAddress[];
    outputLabels: SuiteSyncOutput[];
};

const createMemoizedSelector = createWeakMapSelector.withTypes<SuiteSyncDataRootState>();

export const selectAllLabelsForAccount = createMemoizedSelector(
    [
        (
            state,
            { walletDescriptor, accountDescriptor, networkSymbol }: SelectAllLabelsForAccountParams,
        ) => selectSuiteSyncAccountLabel(state, walletDescriptor, accountDescriptor, networkSymbol),
        (
            state,
            { walletDescriptor, accountDescriptor, networkSymbol }: SelectAllLabelsForAccountParams,
        ) =>
            selectSuiteSyncAccountAddressesByAccount(
                state,
                walletDescriptor,
                accountDescriptor,
                networkSymbol,
            ),
        (
            state,
            { walletDescriptor, accountDescriptor, networkSymbol }: SelectAllLabelsForAccountParams,
        ) =>
            selectSuiteSyncOutputLabelsByAccount(
                state,
                walletDescriptor,
                accountDescriptor,
                networkSymbol,
            ),
    ],
    (accountLabel, addressLabels, outputLabels): AllLabelsForAccount => ({
        accountLabel,
        addressLabels,
        outputLabels,
    }),
);
