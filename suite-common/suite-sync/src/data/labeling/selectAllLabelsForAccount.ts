import type { SuiteSyncAddress, SuiteSyncOutput } from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor, WalletDescriptor } from '@suite-common/wallet-types';

import { selectSuiteSyncAccountLabel } from '../account/selectSuiteSyncAccountLabel';
import { selectSuiteSyncAccountAddressesByAccount } from '../address/suiteSyncAddressSelectors';
import { selectSuiteSyncOutputLabelsByAccount } from '../output/suiteSyncOutputSelectors';
import { SuiteSyncDataRootState } from '../suiteSyncDataReducer';

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

export const selectAllLabelsForAccount = (
    state: SuiteSyncDataRootState,
    { walletDescriptor, accountDescriptor, networkSymbol }: SelectAllLabelsForAccountParams,
): AllLabelsForAccount => ({
    accountLabel: selectSuiteSyncAccountLabel(
        state,
        walletDescriptor,
        accountDescriptor,
        networkSymbol,
    ),
    addressLabels: selectSuiteSyncAccountAddressesByAccount(
        state,
        walletDescriptor,
        accountDescriptor,
        networkSymbol,
    ),
    outputLabels: selectSuiteSyncOutputLabelsByAccount(
        state,
        walletDescriptor,
        accountDescriptor,
        networkSymbol,
    ),
});
