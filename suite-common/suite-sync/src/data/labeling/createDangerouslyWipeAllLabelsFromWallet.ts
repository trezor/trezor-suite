import {
    type DangerouslyWipeAllLabelsFromWallet,
    type UpdateAccountLabelDep,
    type UpdateAddressLabelDep,
    type UpdateOutputLabelDep,
    type UpdateWalletLabelDep,
} from '@suite-common/suite-sync-types';
import { type Account, type WalletDescriptor } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { ok } from '@trezor/type-utils';

import {
    type AllLabelsForAccount,
    type SelectAllLabelsForAccountParams,
} from './selectAllLabelsForAccount';

type GetWalletLabelDep = {
    getWalletLabel: (walletDescriptor: WalletDescriptor) => string | null;
};

type GetAccountsDep = {
    getAccounts: () => Account[];
};

type GetAllLabelsForAccountDep = {
    getAllLabelsForAccount: (params: SelectAllLabelsForAccountParams) => AllLabelsForAccount;
};

export type DangerouslyWipeAllLabelsFromWalletDeps = GetWalletLabelDep &
    GetAccountsDep &
    GetAllLabelsForAccountDep &
    UpdateWalletLabelDep &
    UpdateAccountLabelDep &
    UpdateAddressLabelDep &
    UpdateOutputLabelDep;

export const createDangerouslyWipeAllLabelsFromWallet =
    (deps: DangerouslyWipeAllLabelsFromWalletDeps): DangerouslyWipeAllLabelsFromWallet =>
    async ({ walletDescriptor }) => {
        const walletAccounts = deps
            .getAccounts()
            .filter(
                account =>
                    parseDeviceStaticSessionId(account.deviceState).walletDescriptor ===
                    walletDescriptor,
            );

        const deviceStaticSessionId = walletAccounts[0]?.deviceState;
        if (deviceStaticSessionId === undefined) {
            return ok();
        }

        const walletLabel = deps.getWalletLabel(walletDescriptor);

        if (walletLabel !== null) {
            const walletResult = await deps.updateWalletLabel({
                deviceStaticSessionId,
                label: null,
            });

            if (!walletResult.success) {
                return walletResult;
            }
        }

        for (const account of walletAccounts) {
            const labels = deps.getAllLabelsForAccount({
                walletDescriptor,
                accountDescriptor: account.descriptor,
                networkSymbol: account.symbol,
            });

            if (labels.accountLabel !== null) {
                const accountResult = await deps.updateAccountLabel({
                    deviceStaticSessionId: account.deviceState,
                    accountKey: account.key,
                    label: null,
                });

                if (!accountResult.success) {
                    return accountResult;
                }
            }

            for (const addressLabel of labels.addressLabels) {
                if (addressLabel.label === null) {
                    continue;
                }

                const addressResult = await deps.updateAddressLabel({
                    deviceStaticSessionId: account.deviceState,
                    address: addressLabel.address,
                    label: null,
                    accountDescriptor: account.descriptor,
                    networkSymbol: account.symbol,
                });

                if (!addressResult.success) {
                    return addressResult;
                }
            }

            for (const outputLabel of labels.outputLabels) {
                if (outputLabel.label === null) {
                    continue;
                }

                const outputResult = await deps.updateOutputLabel({
                    deviceStaticSessionId: account.deviceState,
                    txId: outputLabel.txId,
                    txTargetId: outputLabel.txTargetId,
                    label: null,
                    accountDescriptor: account.descriptor,
                    networkSymbol: account.symbol,
                });

                if (!outputResult.success) {
                    return outputResult;
                }
            }
        }

        return ok();
    };
