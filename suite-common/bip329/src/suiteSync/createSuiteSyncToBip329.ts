import { type ExportBip329 } from '@suite-common/bip329-types';
import type { SuiteSyncAddress, SuiteSyncOutput } from '@suite-common/suite-sync-storage';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor, type WalletDescriptor } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

import { suiteSyncToBip329 } from './suiteSyncToBip329';

export type AllLabelsForAccount = {
    accountLabel: string | null;
    addressLabels: SuiteSyncAddress[];
    outputLabels: SuiteSyncOutput[];
};

export type GetAllLabelsForAccountParams = {
    walletDescriptor: WalletDescriptor;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export type GetAllLabelsForAccount = (params: GetAllLabelsForAccountParams) => AllLabelsForAccount;

export type GetAllLabelsForAccountDeps = {
    getAllLabelsForAccount: GetAllLabelsForAccount;
};

export type ExportSuiteSyncToBip329Dep = {
    exportSuiteSyncToBip329: ExportBip329;
};

export const createSuiteSyncToBip329 =
    (deps: GetAllLabelsForAccountDeps): ExportBip329 =>
    ({ account }) => {
        const { walletDescriptor } = parseDeviceStaticSessionId(account.deviceState);

        const { accountLabel, addressLabels, outputLabels } = deps.getAllLabelsForAccount({
            walletDescriptor,
            accountDescriptor: account.descriptor,
            networkSymbol: account.symbol,
        });

        return {
            accountLabel,
            labelsToExport: suiteSyncToBip329({
                outputLabels,
                addressLabels,
                allSpendable: true,
            }),
        };
    };
