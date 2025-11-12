import { createAction } from '@reduxjs/toolkit';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor, WalletDescriptor } from '@suite-common/wallet-types';

export const LABELING_PREFIX = '@suite/labeling';

/** @deprecated This shall be used **ONLY ONCE** in Evolu Subscribe Query. */
export const setWalletLabel = createAction(
    `${LABELING_PREFIX}/set-device-label`,
    (payload: { walletDescriptor: WalletDescriptor; label: string | null }) => ({ payload }),
);

/** @deprecated This shall be used **ONLY ONCE** in Evolu Subscribe Query. */
export const setAccountLabel = createAction(
    `${LABELING_PREFIX}/set-account-label`,
    (payload: {
        walletDescriptor: WalletDescriptor;
        accountDescriptor: AccountDescriptor;
        networkSymbol: NetworkSymbol;
        label: string | null;
    }) => ({
        payload,
    }),
);

/** @deprecated This shall be used **ONLY ONCE** in Evolu Subscribe Query. */
export const setAddressLabel = createAction(
    `${LABELING_PREFIX}/set-address-label`,
    (payload: { walletDescriptor: WalletDescriptor; address: string; label: string | null }) => ({
        payload,
    }),
);

/** @deprecated This shall be used **ONLY ONCE** in Evolu Subscribe Query. */
export const setOutputLabel = createAction(
    `${LABELING_PREFIX}/set-output-label`,
    (payload: {
        walletDescriptor: WalletDescriptor;
        txId: string;
        outputIndex: number;
        label: string | null;
    }) => ({ payload }),
);

/** @deprecated This shall be used **ONLY ONCE** in Evolu Subscribe Query. */
export const clearAllLabels = createAction(
    `${LABELING_PREFIX}/clear-all-labels`,
    (payload: { walletDescriptor: WalletDescriptor }) => ({ payload }),
);

// Todo: this shall be in LocalFirstStorage reducer, not labeling
export const updateLocalFirstStorageEnabled = createAction(
    `${LABELING_PREFIX}/update-locale-first-storage-enabled`,
    (payload: { isEnabled: boolean }) => ({ payload }),
);

// Todo: this shall be in LocalFirstStorage reducer, not labeling
export const updateLocalFirstStorageDebugEnabled = createAction(
    `${LABELING_PREFIX}/update-locale-first-storage-debug-enabled`,
    (payload: { isEnabled: boolean }) => ({ payload }),
);

// Todo: this shall be in LocalFirstStorage reducer, not labeling
export const updateIsFeatureLocalFirstStorageAvailable = createAction(
    `${LABELING_PREFIX}/update-show-locale-first-storage`,
    (payload: { isShownInSettings: boolean }) => ({ payload }),
);

// Todo: this shall be in LocalFirstStorage reducer, not labeling
export const setLocalFirstStorageRelayUrl = createAction(
    `${LABELING_PREFIX}/set-local-first-storage-relay-url`,
    (payload: { url: string | null }) => ({ payload }),
);

export const labelingActions = {
    setWalletLabel,
    setAccountLabel,
    setAddressLabel,
    setOutputLabel,
    clearAllLabels,

    // Todo: this shall be in LocalFirstStorage reducer, not labeling
    updateLocalFirstStorageEnabled,
    updateLocalFirstStorageDebugEnabled,
    updateIsFeatureLocalFirstStorageAvailable,
    setLocalFirstStorageRelayUrl,
};
