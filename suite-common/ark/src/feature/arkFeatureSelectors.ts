import type { WalletDescriptor } from '@suite-common/wallet-types';

import type { ArkState } from './arkFeatureReducer';
import { createArkWalletKey } from '../accounts/arkAccounts';

export type ArkRootState = {
    ark: ArkState;
};

export const selectArk = (state: ArkRootState) => state.ark;

export const selectIsArkEnabled = (state: ArkRootState) => state.ark.isEnabled;

export const selectArkAccountsByWalletDescriptor = (
    state: ArkRootState,
    walletDescriptor: WalletDescriptor,
) => state.ark.accountsByWalletDescriptor[walletDescriptor] ?? [];

export const selectSelectedArkAccountNumber = (
    state: ArkRootState,
    walletDescriptor: WalletDescriptor,
) => state.ark.selectedAccountNumberByWalletDescriptor[walletDescriptor];

export const selectSelectedArkAccount = (
    state: ArkRootState,
    walletDescriptor: WalletDescriptor,
) => {
    const selectedAccountNumber = selectSelectedArkAccountNumber(state, walletDescriptor);

    if (selectedAccountNumber === undefined) {
        return undefined;
    }

    return selectArkAccountsByWalletDescriptor(state, walletDescriptor).find(
        account => account.accountNumber === selectedAccountNumber,
    );
};

export const selectArkWalletByAccountNumber = (
    state: ArkRootState,
    params: {
        accountNumber: number;
        walletDescriptor: WalletDescriptor;
    },
) => state.ark.walletsByKey[createArkWalletKey(params)];
